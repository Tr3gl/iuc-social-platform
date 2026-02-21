'use client';

import { useEffect, useState } from'react';
import { useParams, useRouter } from'next/navigation';
import { useAuth } from'@/components/AuthProvider';
import { getCourseById, submitReview, getUserReviewForCourse, updateReview, getTags, submitPendingSurvivalGuide, getUserPendingSurvivalGuides } from'@/lib/utils';
import {
 DIFFICULTY_VALUE_ALIGNMENT,
 VIZE_FORMAT,
 FINAL_FORMAT,
 EXTRA_ASSESSMENTS,
 RATING_LABELS,
 METRIC_DESCRIPTIONS,
 MAX_COMMENT_LENGTH,
} from'@/lib/constants';
import { ArrowLeft, AlertCircle, Tag as TagIcon, Plus } from'lucide-react';
import TagSuggestionModal from'@/components/TagSuggestionModal';
import { useTranslations } from'next-intl';

export default function ReviewPage() {
 const params = useParams();
 const router = useRouter();
 const { user, loading: authLoading } = useAuth();
 const t = useTranslations('Review');
 const tConstants = useTranslations('Constants');
 const courseId = params.id as string;

 const [course, setCourse] = useState<any>(null);
 const [existingReview, setExistingReview] = useState<any>(null);
 const [availableTags, setAvailableTags] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const [error, setError] = useState('');
 const [showTagModal, setShowTagModal] = useState(false);
 const [validationErrors, setValidationErrors] = useState<string[]>([]);

 const STORAGE_KEY =`review_form_${courseId}`;

 interface FormDataType {
 difficulty: number;
 usefulness: number;
 workload: number;
 attendance: number;
 material_relevance: number;
 exam_predictability: number;
 survival_guide: string;
 difficulty_value_alignment: string;
 midterm_format: string;
 final_format: string;
 extra_assessments: string[];
 instructor_id: string;
 comment: string;
 tags: string[];
 }

 const defaultFormData: FormDataType = {
 difficulty: 0,
 usefulness: 0,
 workload: 0,
 attendance: 0,
 material_relevance: 0,
 exam_predictability: 0,
 survival_guide:'',
 difficulty_value_alignment:'',
 midterm_format:'',
 final_format:'',
 extra_assessments: [],
 instructor_id:'',
 comment:'',
 tags: [],
 };

 const [formData, setFormData] = useState<FormDataType>(() => {
 // Try to restore from sessionStorage on initial mount
 if (typeof window !=='undefined') {
 const saved = sessionStorage.getItem(STORAGE_KEY);
 if (saved) {
 try {
 return JSON.parse(saved) as FormDataType;
 } catch (e) {
 // Invalid JSON, use defaults
 }
 }
 }
 return defaultFormData;
 });


 // Save form data to sessionStorage whenever it changes
 useEffect(() => {
 if (typeof window !=='undefined' && !existingReview) {
 sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
 }
 }, [formData, STORAGE_KEY, existingReview]);

 const clearSavedForm = () => {
 if (typeof window !=='undefined') {
 sessionStorage.removeItem(STORAGE_KEY);
 }
 };

 useEffect(() => {
 if (!authLoading && !user) {
 router.push('/auth/signin');
 } else if (user) {
 loadData();
 }
 }, [user, authLoading, courseId]);

 const loadData = async () => {
 try {
 const [courseData, reviewData, tagsData, pendingGuides] = await Promise.all([
 getCourseById(courseId),
 getUserReviewForCourse(courseId, user!.id),
 getTags(),
 getUserPendingSurvivalGuides(courseId) // Fetch pending guides
 ]);

 setCourse(courseData);
 setExistingReview(reviewData);
 setAvailableTags(tagsData || []);

 const pendingGuideContent = pendingGuides?.[0]?.survival_guide ||'';

 if (reviewData) {
 setFormData({
 difficulty: reviewData.difficulty,
 usefulness: reviewData.usefulness,
 workload: reviewData.workload,
 attendance: reviewData.attendance || 0,
 material_relevance: reviewData.material_relevance || 0,
 exam_predictability: reviewData.exam_predictability || 0,
 survival_guide: pendingGuideContent || reviewData.survival_guide ||'', // Prioritize pending
 difficulty_value_alignment: reviewData.difficulty_value_alignment,
 midterm_format: reviewData.midterm_format ||'',
 final_format: reviewData.final_format ||'',
 extra_assessments: reviewData.extra_assessments || [],
 instructor_id: reviewData.instructor_id ||'',
 comment: reviewData.comment ||'',
 tags: reviewData.review_tags ? reviewData.review_tags.map((rt: any) => rt.tag_id) : [],
 });
 } else if (courseData.course_instructors && courseData.course_instructors.length === 1) {
 setFormData(prev => ({
 ...prev,
 instructor_id: courseData.course_instructors?.[0]?.instructors?.id ||'',
 survival_guide: pendingGuideContent || prev.survival_guide, // Pre-fill pending even if new review
 }));
 } else if (pendingGuideContent) {
 setFormData(prev => ({
 ...prev,
 survival_guide: pendingGuideContent,
 }));
 }
 } catch (error) {
 console.error('Error loading data:', error);
 } finally {
 setLoading(false);
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setValidationErrors([]);

 // Compute validation errors
 const errors: string[] = [];

 const metrics = [
 { name:'Zorluk', value: formData.difficulty },
 { name:'Faydalılık', value: formData.usefulness },
 { name:'İş Yükü', value: formData.workload },
 { name:'Yoklama', value: formData.attendance },
 { name:'Materyal Güncelliği', value: formData.material_relevance },
 { name:'Sınav Öngörülebilirliği', value: formData.exam_predictability },
 ];

 const missingMetrics = metrics.filter(m => m.value === 0).map(m => m.name);
 if (missingMetrics.length > 0) {
 errors.push(`Eksik puanlamalar: ${missingMetrics.join(',')}`);
 }

 if (!formData.difficulty_value_alignment) {
 errors.push('Zorluk değerlendirmesi seçilmedi');
 }
 if (!formData.midterm_format) {
 errors.push('Vize formatı seçilmedi');
 }
 if (!formData.final_format) {
 errors.push('Final formatı seçilmedi');
 }

 if (errors.length > 0) {
 setValidationErrors(errors);
 setError('Lütfen tüm gerekli alanları doldurun');
 return;
 }

 setSubmitting(true);

 try {
 // Submit survival guide to pending/moderation queue if provided
 if (formData.survival_guide.trim()) {
 await submitPendingSurvivalGuide(courseId, formData.survival_guide);
 }

 // Submit review without the survival_guide (it goes through moderation)
 const reviewData = {
 ...formData,
 survival_guide:'',
 course_id: courseId,
 instructor_id: formData.instructor_id || null,
 };

 if (existingReview) {
 await updateReview(existingReview.id, reviewData);
 } else {
 await submitReview(reviewData);
 }

 clearSavedForm();
 router.push(`/course/${courseId}`);
 } catch (err: any) {
 setError(err.message ||'Değerlendirme kaydedilirken bir hata oluştu');
 } finally {
 setSubmitting(false);
 }
 };

 const toggleTag = (tagId: string) => {
 setFormData(prev => {
 const newTags = prev.tags.includes(tagId)
 ? prev.tags.filter(t => t !== tagId)
 : [...prev.tags, tagId];
 return { ...prev, tags: newTags };
 });
 };

 const RatingSelector = ({
 label,
 value,
 onChange,
 description
 }: {
 label: string;
 value: number;
 onChange: (val: number) => void;
 description?: { 1: string, 5: string };
 }) => (
 <div className="bg-neutral-50 p-4 rounded-lg">
 <div className="flex justify-between items-center mb-3">
 <label className="text-sm font-medium text-neutral-900">
 {label}
 </label>
 {value > 0 && (
 <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-1 rounded">
 {value}/5 - {tConstants(`rating_labels.${value}`)}
 </span>
 )}
 </div>

 <div className="flex items-center justify-between gap-2">
 {description && <span className="text-xs text-neutral-500 w-20 text-right">{tConstants(`metrics.${description[1]}`)}</span>}
 <div className="flex space-x-1 flex-1 justify-center">
 {[1, 2, 3, 4, 5].map((rating) => (
 <button
 key={rating}
 type="button"
 onClick={() => onChange(rating)}
 className={`rating-button w-10 h-10 ${value === rating ?'selected ring-2 ring-primary-600 ring-offset-1' :''}`}
 >
 {rating}
 </button>
 ))}
 </div>
 {description && <span className="text-xs text-neutral-500 w-20">{tConstants(`metrics.${description[5]}`)}</span>}
 </div>
 </div>
 );

 if (loading || authLoading) {
 return (
 <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
 <div className="text-center">
 <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
 <p className="mt-4 text-neutral-600">{t('saving')}</p>
 </div>
 </div>
 );
 }

 if (!course) return null;

 const instructors = (course.course_instructors || [])
 .map((ci: any) => ci.instructors)
 .filter(Boolean);

 return (
 <div className="min-h-screen bg-neutral-50 text-neutral-900 ">
 <div className="container mx-auto px-4 py-8 max-w-3xl">
 <button
 onClick={() => router.push(`/course/${courseId}`)}
 className="flex items-center space-x-2 text-neutral-600 hover:text-primary-600 mb-6 px-3 py-2 bg-neutral-100 hover:bg-primary-50 rounded-lg transition-colors text-base font-medium"
 >
 <ArrowLeft className="w-5 h-5"/>
 <span>{t('back_to_course', { fallback:'Back to Course' })}</span>
 </button>

 <div className="card p-8">
 <h1 className="text-3xl font-bold text-neutral-900 mb-2">
 {existingReview ? t('title_edit') : t('title_new')}
 </h1>
 <p className="text-neutral-600 mb-6">
 {course.name} ({course.code})
 </p>

 {error && (
 <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
 <p className="text-sm text-red-800 font-medium">{error}</p>
 {validationErrors.length > 0 && (
 <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
 {validationErrors.map((err, i) => (
 <li key={i}>{err}</li>
 ))}
 </ul>
 )}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-8">
 {/* Instructor Selection */}
 {instructors.length > 1 && (
 <div>
 <label className="block text-sm font-medium text-neutral-700 mb-2">
 {t('instructor')}
 </label>
 <select
 value={formData.instructor_id}
 onChange={(e) =>
 setFormData({ ...formData, instructor_id: e.target.value })
 }
 className="input"
 required
 >
 <option value="">{t('select')}</option>
 {instructors.map((instructor: any) => (
 <option key={instructor.id} value={instructor.id}>
 {instructor.name}
 </option>
 ))}
 </select>
 </div>
 )}

 {/* Structured Ratings */}
 <div className="space-y-4">
 <h3 className="section-title text-lg border-b pb-2">{t('course_assessment')}</h3>

 <RatingSelector
 label={t('difficulty')}
 value={formData.difficulty}
 onChange={(val) => setFormData({ ...formData, difficulty: val })}
 description={METRIC_DESCRIPTIONS.difficulty}
 />

 <RatingSelector
 label={t('usefulness')}
 value={formData.usefulness}
 onChange={(val) => setFormData({ ...formData, usefulness: val })}
 />

 <RatingSelector
 label={t('workload')}
 value={formData.workload}
 onChange={(val) => setFormData({ ...formData, workload: val })}
 />

 {/* Attendance - Binary Choice */}
 <div className="bg-neutral-50 p-4 rounded-lg">
 <div className="flex justify-between items-center mb-3">
 <label className="text-base font-medium text-neutral-900">
 {t('attendance')}
 </label>
 {formData.attendance > 0 && (
 <span className={`text-xs font-semibold px-2 py-1 rounded ${formData.attendance === 5 ?'bg-red-50 text-red-700' :'bg-green-50 text-green-700'}`}>
 {formData.attendance === 5 ? t('required_yes') : t('required_no')}
 </span>
 )}
 </div>
 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => setFormData({ ...formData, attendance: 1 })}
 className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-all ${formData.attendance === 1
 ?'bg-green-600 text-white border-green-600 shadow-sm'
 :'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
 }`}
 >
 {t('required_no')}
 </button>
 <button
 type="button"
 onClick={() => setFormData({ ...formData, attendance: 5 })}
 className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-all ${formData.attendance === 5
 ?'bg-red-600 text-white border-red-600 shadow-sm'
 :'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
 }`}
 >
 {t('required_yes')}
 </button>
 </div>
 </div>

 <RatingSelector
 label={t('material_relevance')}
 value={formData.material_relevance}
 onChange={(val) => setFormData({ ...formData, material_relevance: val })}
 description={METRIC_DESCRIPTIONS.material_relevance}
 />
 </div>

 <div className="space-y-4">
 <h3 className="section-title text-lg border-b pb-2">{t('exam_assessment')}</h3>

 <RatingSelector
 label={t('exam_predictability')}
 value={formData.exam_predictability}
 onChange={(val) => setFormData({ ...formData, exam_predictability: val })}
 description={METRIC_DESCRIPTIONS.exam_predictability}
 />

 <div className="space-y-6 mt-4">
 <div>
 <label className="block text-base font-medium text-neutral-700 mb-3">
 {t('difficulty_value_alignment')}
 </label>
 <div className="flex flex-wrap gap-2">
 {Object.entries(DIFFICULTY_VALUE_ALIGNMENT).map(([key, label]) => (
 <label key={key} className={`cursor-pointer px-4 py-2 rounded-full text-base border transition-all ${formData.difficulty_value_alignment === key
 ?'bg-primary-600 text-white border-primary-600'
 :'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
 }`}>
 <input
 type="radio"
 name="difficulty_value_alignment"
 value={key}
 checked={formData.difficulty_value_alignment === key}
 onChange={(e) =>
 setFormData({ ...formData, difficulty_value_alignment: e.target.value })
 }
 className="sr-only"
 />
 {tConstants(`difficulty_value.${key}`)}
 </label>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-base font-medium text-neutral-700 mb-3">
 {t('midterm_format')}
 </label>
 <div className="flex flex-wrap gap-2">
 {Object.entries(VIZE_FORMAT).map(([key, label]) => (
 <label key={key} className={`cursor-pointer px-4 py-2 rounded-full text-base border transition-all ${formData.midterm_format === key
 ?'bg-primary-600 text-white border-primary-600'
 :'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
 }`}>
 <input
 type="radio"
 name="midterm_format"
 value={key}
 checked={formData.midterm_format === key}
 onChange={(e) =>
 setFormData({ ...formData, midterm_format: e.target.value })
 }
 className="sr-only"
 />
 {tConstants(`exam_format.${key}`)}
 </label>
 ))}
 </div>
 </div>

 <div>
 <label className="block text-base font-medium text-neutral-700 mb-3">
 {t('final_format')}
 </label>
 <div className="flex flex-wrap gap-2">
 {Object.entries(FINAL_FORMAT).map(([key, label]) => (
 <label key={key} className={`cursor-pointer px-4 py-2 rounded-full text-base border transition-all ${formData.final_format === key
 ?'bg-primary-600 text-white border-primary-600'
 :'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
 }`}>
 <input
 type="radio"
 name="final_format"
 value={key}
 checked={formData.final_format === key}
 onChange={(e) =>
 setFormData({ ...formData, final_format: e.target.value })
 }
 className="sr-only"
 />
 {tConstants(`exam_format.${key}`)}
 </label>
 ))}
 </div>
 </div>

 {/* Extra Assessments - Optional */}
 <div>
 <label className="block text-base font-medium text-neutral-700 mb-1">
 {t('extra_assessments')}
 </label>
 <p className="text-sm text-neutral-500 mb-3">
 {t('extra_assessments_hint')}
 </p>
 <div className="flex flex-wrap gap-2">
 {Object.entries(EXTRA_ASSESSMENTS).map(([key, label]) => {
 const isSelected = formData.extra_assessments.includes(key);
 return (
 <button
 key={key}
 type="button"
 onClick={() => {
 setFormData(prev => ({
 ...prev,
 extra_assessments: isSelected
 ? prev.extra_assessments.filter(a => a !== key)
 : [...prev.extra_assessments, key]
 }));
 }}
 className={`px-4 py-2 rounded-full text-base border transition-all ${isSelected
 ?'bg-accent-yellow text-primary-900 border-accent-yellow font-semibold'
 :'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
 }`}
 >
 {tConstants(`extra_assessments.${key}`)}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 </div>

 {/* Survival Guide */}
 <div>
 <h3 className="section-title text-lg border-b pb-2 mb-4">{t('survival_guide')}</h3>
 <p className="text-sm text-neutral-600 mb-2">
 {t('survival_guide_hint')}
 </p>
 <textarea
 value={formData.survival_guide}
 onChange={(e) =>
 setFormData({ ...formData, survival_guide: e.target.value.slice(0, 280) })
 }
 rows={3}
 className="input resize-none w-full"
 placeholder={t('survival_guide_placeholder')}
 />
 <p className="text-xs text-neutral-500 mt-1 text-right">
 {formData.survival_guide.length} / 280
 </p>
 </div>

 {/* Tags */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h3 className="section-title text-lg border-b pb-2 flex-1">{t('tags')}</h3>
 <button
 type="button"
 onClick={() => setShowTagModal(true)}
 className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
 >
 <Plus className="w-4 h-4"/>
 <span>{t('suggest_tag')}</span>
 </button>
 </div>
 <div className="flex flex-wrap gap-2">
 {availableTags.map((tag) => (
 <button
 key={tag.id}
 type="button"
 onClick={() => toggleTag(tag.id)}
 className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${formData.tags.includes(tag.id)
 ? tag.type ==='positive'
 ?'bg-green-100 text-green-800 border-green-200'
 :'bg-red-100 text-red-800 border-red-200'
 :'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
 }`}
 >
 <div className="flex items-center space-x-1">
 <TagIcon className="w-3 h-3"/>
 <span>{tag.name}</span>
 </div>
 </button>
 ))}
 </div>
 {availableTags.length === 0 && (
 <p className="text-sm text-neutral-500">{t('no_tags_yet')}</p>
 )}
 </div>

 {/* Validation Errors Near Submit */}
 {validationErrors.length > 0 && (
 <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
 <p className="text-sm text-amber-800 font-medium flex items-center">
 <AlertCircle className="w-4 h-4 mr-2"/>
 {t('validation_errors_title')}
 </p>
 <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
 {validationErrors.slice(0, 3).map((err, i) => (
 <li key={i}>{err}</li>
 ))}
 {validationErrors.length > 3 && (
 <li>{t('and_more', { count: validationErrors.length - 3 })}</li>
 )}
 </ul>
 </div>
 )}

 {/* API Error Near Submit */}
 {error && (
 <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
 <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0"/>
 <p className="text-sm text-red-800 font-medium">{error}</p>
 </div>
 )}

 {/* Submit */}
 <div className="flex space-x-4 pt-6">
 <button
 type="submit"
 disabled={submitting}
 className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {submitting
 ? t('saving')
 : existingReview
 ? t('update')
 : t('submit')}
 </button>
 <button
 type="button"
 onClick={() => router.push(`/course/${courseId}`)}
 className="btn btn-secondary"
 >
 {t('cancel')}
 </button>
 </div>
 </form>
 </div>
 </div>

 {/* Tag Suggestion Modal */}
 {showTagModal && (
 <TagSuggestionModal
 courseId={courseId}
 onClose={() => setShowTagModal(false)}
 />
 )}
 </div>
 );
}
