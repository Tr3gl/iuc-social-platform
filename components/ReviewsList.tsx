'use client';

import { useState, useEffect } from'react';
import { useParams } from'next/navigation';
import { useAuth } from'./AuthProvider';
import { reportReview, toggleVote, getUserPendingSurvivalGuides } from'@/lib/utils';
import {
 RATING_LABELS,
 METRIC_DESCRIPTIONS,
 VIZE_FORMAT,
 FINAL_FORMAT,
 DIFFICULTY_VALUE_ALIGNMENT,
} from'@/lib/constants';
import { MessageSquare, Flag, ThumbsUp, HelpCircle, XCircle, AlertTriangle, Tag as TagIcon, User, Calendar, Clock } from'lucide-react';
import { useTranslations, useLocale } from'next-intl';
import { Review } from'@/lib/types'; // Import shared type

interface Props {
 reviews: Review[];
 onRefresh?: () => void;
}

type VoteType ='helpful' |'missing_parts' |'totally_wrong' |'rage_bait';

export default function ReviewsList({ reviews, onRefresh }: Props) {
 const { user } = useAuth();
 const params = useParams();
 const t = useTranslations('Reviews');
 const tConstants = useTranslations('Constants');
 const locale = useLocale();
 const courseId = Array.isArray(params?.id) ? params.id[0] : params?.id;

 const [pendingGuides, setPendingGuides] = useState<any[]>([]);
 const [reportingId, setReportingId] = useState<string | null>(null);
 const [reportReason, setReportReason] = useState('');
 const [showReportForm, setShowReportForm] = useState(false);
 const [userVotes, setUserVotes] = useState<Record<string, string | null>>({});
 const [voteCounts, setVoteCounts] = useState<Record<string, Record<VoteType, number>>>({});
 const [reportSuccess, setReportSuccess] = useState(false);

 useEffect(() => {
 const fetchPending = async () => {
 if (user && courseId) {
 const guides = await getUserPendingSurvivalGuides(courseId);
 if (guides && guides.length > 0) {
 setPendingGuides(guides);
 }
 }
 };
 fetchPending();
 }, [user, courseId]);

 // Initialize user votes and counts from reviews data
 const getUserVote = (review: Review): string | null => {
 if (!user || !review.review_votes) return null;
 const userVote = review.review_votes.find(v => v.user_id === user.id);
 return userVote?.vote_type || null;
 };

 const getVoteCounts = (review: Review): Record<VoteType, number> => {
 const votes = review.review_votes || [];
 return {
 helpful: votes.filter(v => v.vote_type ==='helpful').length,
 missing_parts: votes.filter(v => v.vote_type ==='missing_parts').length,
 totally_wrong: votes.filter(v => v.vote_type ==='totally_wrong').length,
 rage_bait: votes.filter(v => v.vote_type ==='rage_bait').length,
 };
 };

 const handleReport = (reviewId: string) => {
 if (!user) return;

 // Optimistically close form and show success
 setReportSuccess(true);
 setShowReportForm(false);
 setReportReason('');
 setReportingId(null);

 // Reset success message after 3 seconds
 setTimeout(() => setReportSuccess(false), 3000);

 // Send request in background
 reportReview(reviewId, reportReason).catch((error) => {
 console.error('Report error:', error);
 // Ideally show an error toast here if it fails, but for now we just log it
 // to keep the "happy path"fast.
 });
 };

 const handleVote = (reviewId: string, type: VoteType) => {
 if (!user) return;

 // 1. Calculate the new state immediately (Optimistic Update)
 const currentCounts = voteCounts[reviewId] || getVoteCounts(reviews.find(r => r.id === reviewId)!);
 const currentUserVote = userVotes[reviewId] ?? getUserVote(reviews.find(r => r.id === reviewId)!);

 let newVoteType: string | null = null;
 let newCounts = { ...currentCounts };

 // Determine visual toggle logic locally
 if (currentUserVote === type) {
 // Toggle off
 newVoteType = null;
 newCounts[type] = Math.max(0, newCounts[type] - 1);
 } else {
 // Change vote (remove old if exists, add new)
 if (currentUserVote) {
 newCounts[currentUserVote as VoteType] = Math.max(0, newCounts[currentUserVote as VoteType] - 1);
 }
 newVoteType = type;
 newCounts[type] = newCounts[type] + 1;
 }

 // 2. Update UI instantly
 setUserVotes(prev => ({ ...prev, [reviewId]: newVoteType }));
 setVoteCounts(prev => ({ ...prev, [reviewId]: newCounts }));

 // 3. Sync with server in background
 // We don't set loading state to avoid blocking the UI
 toggleVote(reviewId, type).catch((error) => {
 console.error('Vote error:', error);
 // Revert on error (Pessimistic Rollback)
 setUserVotes(prev => ({ ...prev, [reviewId]: currentUserVote }));
 setVoteCounts(prev => ({ ...prev, [reviewId]: currentCounts }));
 });
 };

 const getVoteButtonClass = (reviewId: string, type: VoteType, review: Review) => {
 const currentVote = userVotes[reviewId] ?? getUserVote(review);
 const isActive = currentVote === type;
 // const isLoading = votingLoading === reviewId; // Removed reference

 const baseClass = "flex items-center space-x-1 px-3 py-1.5 rounded-full transition-all text-xs font-medium";

 // Optimistic UI: No loading state shown to user for instant feel

 if (isActive) {
 switch (type) {
 case'helpful':
 return`${baseClass} bg-green-500 text-white shadow-sm`;
 case'missing_parts':
 return`${baseClass} bg-blue-500 text-white shadow-sm`;
 case'totally_wrong':
 return`${baseClass} bg-red-500 text-white shadow-sm`;
 case'rage_bait':
 return`${baseClass} bg-orange-500 text-white shadow-sm`;
 }
 }

 switch (type) {
 case'helpful':
 return`${baseClass} bg-neutral-100 hover:bg-green-50 hover:text-green-600 text-neutral-600`;
 case'missing_parts':
 return`${baseClass} bg-neutral-100 hover:bg-blue-50 hover:text-blue-600 text-neutral-600`;
 case'totally_wrong':
 return`${baseClass} bg-neutral-100 hover:bg-red-50 hover:text-red-600 text-neutral-600`;
 case'rage_bait':
 return`${baseClass} bg-neutral-100 hover:bg-orange-50 hover:text-orange-600 text-neutral-600`;
 }
 };

 if (reviews.length === 0) {
 return (
 <div className="card p-8 text-center">
 <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-4"/>
 <p className="text-neutral-600">{t('no_reviews')}</p>
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {/* Pending Guides Alert */}
 {pendingGuides.slice(0, 1).map(guide => (
 <div key={guide.id} className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-4">
 <div className="flex items-start">
 <Clock className="w-5 h-5 text-amber-600 mr-2 mt-0.5"/>
 <div className="flex-1">
 <h3 className="text-sm font-bold text-amber-800 uppercase tracking-wide mb-1">
 {t('pending_review')}
 </h3>
 <p className="text-base text-neutral-800 mb-2 italic">"{guide.survival_guide}"</p>
 <div className="text-xs text-amber-900 bg-amber-200 inline-block px-2 py-1 rounded font-bold border border-amber-300">
 {t('pending_verification')}
 </div>
 </div>
 </div>
 </div>
 ))}
 {reviews.map((review) => {
 const counts = voteCounts[review.id] || getVoteCounts(review);

 return (
 <div key={review.id} className="card p-6 border-l-4 border-l-primary-600 hover:border-l-primary-500 transition-all shadow-sm border border-neutral-200 ">
 {/* Header: Date and Instructor */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-neutral-200 pb-3">
 <div className="flex items-center space-x-2 text-sm text-neutral-500 font-medium mb-2 sm:mb-0">
 <Calendar className="w-4 h-4"/>
 <span>{new Date(review.created_at).toLocaleDateString(locale ==='tr' ?'tr-TR' :'en-US', { day:'numeric', month:'long', year:'numeric' })}</span>
 </div>

 {review.instructors && (
 <div className="flex items-center space-x-2">
 <User className="w-4 h-4 text-primary-600"/>
 <span className="text-sm font-semibold text-primary-700">
 {review.instructors.name}
 </span>
 </div>
 )}
 </div>

 {/* Content Body */}
 <div className="space-y-6">

 {/* Tags Group */}
 {review.review_tags && review.review_tags.length > 0 && (
 <div className="flex flex-wrap gap-2">
 {review.review_tags.map(rt => (
 <span key={rt.tags.id} className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${rt.tags.type ==='positive'
 ?'bg-green-50 text-green-700 border-green-200'
 :'bg-red-50 text-red-700 border-red-200'
 }`}>
 {rt.tags.name}{rt.tags.name_tr ?` / ${rt.tags.name_tr}` :''}
 </span>
 ))}
 </div>
 )}

 {/* Survival Guide */}
 {review.survival_guide && (
 <div className="bg-amber-50 border-l-4 border-accent-yellow p-5 rounded-r-lg">
 <div className="flex items-start">
 <span className="text-2xl mr-3">💡</span>
 <div>
 <h4 className="text-sm font-extrabold text-amber-700 uppercase tracking-widest mb-2">{t('survival_guide')}</h4>
 <p className="text-base text-neutral-800 italic leading-relaxed font-medium">"{review.survival_guide}"</p>
 </div>
 </div>
 </div>
 )}

 {/* Metrics Grid */}
 <div className="grid md:grid-cols-2 gap-6 bg-neutral-50 p-5 rounded-xl border border-neutral-200">
 {/* Course Ratings */}
 <div className="space-y-4 text-base">
 <h4 className="font-semibold text-neutral-800 border-b border-neutral-200 pb-2">{t('course_ratings_title')}</h4>

 {/* Grid Container for strictly aligned columns */}
 <div className="grid grid-cols-[130px_30px_1fr] gap-y-3 items-center">

 {/* Zorluk */}
 <span className="text-neutral-600">{t('difficulty')}</span>
 <span className="font-bold text-neutral-900 text-center">{review.difficulty}</span>
 <span className="text-sm text-neutral-500 ml-2 truncate">
 {METRIC_DESCRIPTIONS.difficulty[review.difficulty as 1 | 5] ?`(${tConstants(`metrics.${METRIC_DESCRIPTIONS.difficulty[review.difficulty as 1 | 5]}`)})` :''}
 </span>

 {/* Faydalılık */}
 <span className="text-neutral-600">{t('usefulness')}</span>
 <span className="font-bold text-neutral-900 text-center">{review.usefulness}</span>
 <span className="col-span-1"></span>

 {/* İş Yükü */}
 <span className="text-neutral-600">{t('workload')}</span>
 <span className="font-bold text-neutral-900 text-center">{review.workload}</span>
 <span className="col-span-1"></span>

 {/* Materyal Uyumu */}
 {(review.material_relevance || 0) > 0 && (
 <>
 <>
 <span className="text-neutral-600">{t('material_relevance')}</span>
 <span className="font-bold text-neutral-900 text-center">{review.material_relevance}</span>
 <span className="text-sm text-neutral-500 ml-2 truncate">
 {METRIC_DESCRIPTIONS.material_relevance[(review.material_relevance || 0) as 1 | 5] ?`(${tConstants(`metrics.${METRIC_DESCRIPTIONS.material_relevance[(review.material_relevance || 0) as 1 | 5]}`)})` :''}
 </span>
 </>
 </>
 )}
 </div>
 </div>

 {/* Exam Ratings & Info */}
 <div className="space-y-4 text-base">
 <h4 className="font-semibold text-neutral-800 border-b border-neutral-200 pb-2">{t('exam_info_title')}</h4>

 <div className="grid grid-cols-[130px_30px_1fr] gap-y-3 items-center">
 {(review.exam_predictability || 0) > 0 && (
 <>
 <>
 <span className="text-neutral-600">{t('exam_predictability')}</span>
 <span className="font-bold text-neutral-900 text-center">{review.exam_predictability}</span>
 <span className="text-sm text-neutral-500 ml-2 truncate">
 {METRIC_DESCRIPTIONS.exam_predictability[(review.exam_predictability || 0) as 1 | 5] ?`(${tConstants(`metrics.${METRIC_DESCRIPTIONS.exam_predictability[(review.exam_predictability || 0) as 1 | 5]}`)})` :''}
 </span>
 </>
 </>
 )}
 </div>

 {/* Exam Formats & Alignment */}
 <div className="pt-3 mt-3 border-t border-neutral-200">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
 {/* Attendance (Moved here) */}
 {(review.attendance || 0) > 0 && (
 <div className="flex justify-between items-center text-sm">
 <span className="text-neutral-600 font-medium">{t('attendance_label')}</span>
 <span className={`font-medium px-2 py-0.5 rounded border ${review.attendance === 5
 ?'bg-red-50 text-red-700 border-red-200'
 :'bg-green-50 text-green-700 border-green-200'
 }`}>
 {review.attendance === 5 ? t('attendance_required') : t('attendance_none')}
 </span>
 </div>
 )}

 {review.midterm_format && (
 <div className="flex justify-between items-center text-sm">
 <span className="text-neutral-600 font-medium">{t('vize_format_label')}</span>
 <span className="text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
 {review.midterm_format ? tConstants(`exam_format.${review.midterm_format}`) : review.midterm_format}
 </span>
 </div>
 )}
 {review.final_format && (
 <div className="flex justify-between items-center text-sm">
 <span className="text-neutral-600 font-medium">{t('final_format_label')}</span>
 <span className="text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-300">
 {review.final_format ? tConstants(`exam_format.${review.final_format}`) : review.final_format}
 </span>
 </div>
 )}
 </div>

 {review.difficulty_value_alignment && (
 <div className="mt-3 pt-2 text-sm border-t border-neutral-200 border-dashed">
 <span className="block text-neutral-500 mb-1 font-medium">{t('difficulty_value_balance_label')}</span>
 <span className="block font-semibold text-primary-700 italic">
 {review.difficulty_value_alignment ? tConstants(`difficulty_value.${review.difficulty_value_alignment}`) : review.difficulty_value_alignment}
 </span>
 </div>
 )}

 {/* Extra Assessments */}
 {(review as any).extra_assessments && (review as any).extra_assessments.length > 0 && (
 <div className="mt-3 pt-2 text-sm border-t border-neutral-200 border-dashed">
 <span className="block text-neutral-500 mb-2 font-medium">{t('extra_assessments_label')}</span>
 <div className="flex flex-wrap gap-1.5">
 {(review as any).extra_assessments.map((a: string) => (
 <span key={a} className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium">
 {tConstants(`extra_assessments.${a}`)}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Trust Buttons */}
 <div className="mt-6 pt-4 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4">
 <div className="flex items-center space-x-2 flex-wrap gap-2">
 <button
 onClick={() => handleVote(review.id,'helpful')}
 className={getVoteButtonClass(review.id,'helpful', review)}
 disabled={!user}
 >
 <ThumbsUp className="w-3 h-3"/>
 <span>{t('helpful')} ({counts.helpful})</span>
 </button>
 <button
 onClick={() => handleVote(review.id,'missing_parts')}
 className={getVoteButtonClass(review.id,'missing_parts', review)}
 disabled={!user}
 >
 <HelpCircle className="w-3 h-3"/>
 <span>{t('missing')} ({counts.missing_parts})</span>
 </button>
 <button
 onClick={() => handleVote(review.id,'totally_wrong')}
 className={getVoteButtonClass(review.id,'totally_wrong', review)}
 disabled={!user}
 >
 <XCircle className="w-3 h-3"/>
 <span>{t('wrong')} ({counts.totally_wrong})</span>
 </button>
 <button
 onClick={() => handleVote(review.id,'rage_bait')}
 className={getVoteButtonClass(review.id,'rage_bait', review)}
 disabled={!user}
 >
 <AlertTriangle className="w-3 h-3"/>
 <span>{t('troll')} ({counts.rage_bait})</span>
 </button>
 </div>

 {user && (
 <div>
 {reportingId === review.id && showReportForm ? (
 <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-4 duration-200">
 <input
 type="text"
 value={reportReason}
 onChange={(e) => setReportReason(e.target.value)}
 placeholder={t('report_reason_placeholder')}
 className="text-xs px-2 py-1 border border-neutral-300 bg-white text-neutral-900 rounded w-32 outline-none focus:border-red-500 "
 autoFocus
 />
 <button onClick={() => handleReport(review.id)} className="text-xs text-red-600 font-bold hover:underline">{t('report_action')}</button>
 <button onClick={() => { setShowReportForm(false); setReportingId(null); }} className="text-xs text-neutral-500 hover:text-neutral-700">{t('cancel')}</button>
 </div>
 ) : reportSuccess && reportingId === review.id ? (
 <span className="text-xs text-green-600 font-bold">✓ {t('report_sent')}</span>
 ) : (
 <button
 onClick={() => { setReportingId(review.id); setShowReportForm(true); }}
 className="text-sm text-neutral-500 hover:text-red-600 flex items-center space-x-1.5 transition-colors bg-neutral-100 hover:bg-red-50 px-3 py-1.5 rounded-full"
 >
 <Flag className="w-5 h-5"/>
 <span>{t('report')}</span>
 </button>
 )}
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 );
}
