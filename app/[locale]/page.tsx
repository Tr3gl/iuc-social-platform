'use client';

import { useState, useEffect, useCallback } from'react';
import Link from'next/link';
import { Search, BookOpen, ChevronRight, X, MessageSquarePlus } from'lucide-react';
import { getTopLevelFaculties, searchCourses, searchInstructors } from'@/lib/utils';
import { submitFacultyRequest } from'@/app/actions';
import { useTranslations, useLocale } from'next-intl';
import { Course } from'@/lib/types';
import { User } from'lucide-react';

export default function Home() {
 const t = useTranslations('Index');
 const tDisclaimer = useTranslations('Disclaimer');
 const locale = useLocale();
 const [faculties, setFaculties] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');

 // Course/Instructor search state
 const [searchType, setSearchType] = useState<'course' |'instructor'>('course');
 const [searchResults, setSearchResults] = useState<any[]>([]); // Course[] or Instructor[]
 const [isSearching, setIsSearching] = useState(false);
 const [showResults, setShowResults] = useState(false);

 // Faculty request modal state
 const [showRequestModal, setShowRequestModal] = useState(false);
 const [requestForm, setRequestForm] = useState({
 facultyName:'',
 majorName:'',
 email:'',
 message:''
 });
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [submitStatus, setSubmitStatus] = useState<'idle' |'success' |'error'>('idle');

 useEffect(() => {
 async function fetchFaculties() {
 try {
 const data = await getTopLevelFaculties();
 setFaculties(data);
 } catch (error) {
 console.error('Error fetching faculties:', error);
 } finally {
 setLoading(false);
 }
 }
 fetchFaculties();
 }, []);

 // Debounced search
 useEffect(() => {
 const timer = setTimeout(async () => {
 if (searchQuery.trim().length >= 2) {
 setIsSearching(true);
 try {
 let results = [];
 if (searchType ==='course') {
 results = await searchCourses(searchQuery);
 } else {
 results = await searchInstructors(searchQuery);
 }
 setSearchResults(results);
 setShowResults(true);
 } catch (error) {
 console.error('Search error:', error);
 setSearchResults([]);
 } finally {
 setIsSearching(false);
 }
 } else {
 setSearchResults([]);
 setShowResults(false);
 }
 }, 300);

 return () => clearTimeout(timer);
 }, [searchQuery, searchType]);

 // Close search results when clicking outside
 useEffect(() => {
 const handleClickOutside = (e: MouseEvent) => {
 const target = e.target as HTMLElement;
 if (!target.closest('.search-container')) {
 setShowResults(false);
 }
 };
 document.addEventListener('click', handleClickOutside);
 return () => document.removeEventListener('click', handleClickOutside);
 }, []);

 // Get localized faculty name
 const getFacultyName = (faculty: any) => {
 if (locale ==='tr' && faculty.name_tr) {
 return faculty.name_tr;
 }
 return faculty.name;
 };

 // Get localized course faculty name
 const getCourseFacultyName = (course: Course) => {
 const faculty = (course as any).faculties;
 if (!faculty) return'';
 if (locale ==='tr' && faculty.name_tr) {
 return faculty.name_tr;
 }
 return faculty.name;
 };

 const filteredFaculties = faculties.filter(faculty => {
 const name = getFacultyName(faculty);
 return name.toLowerCase().includes(searchQuery.toLowerCase());
 });

 const handleRequestSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!requestForm.facultyName.trim()) return;

 setIsSubmitting(true);
 setSubmitStatus('idle');

 try {
 await submitFacultyRequest({
 facultyName: requestForm.facultyName,
 majorName: requestForm.majorName || undefined,
 email: requestForm.email || undefined,
 message: requestForm.message || undefined
 });
 setSubmitStatus('success');
 setRequestForm({ facultyName:'', majorName:'', email:'', message:'' });
 } catch (error) {
 console.error('Submit error:', error);
 setSubmitStatus('error');
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="min-h-screen bg-neutral-50 text-neutral-900 ">
 {/* Hero Section */}
 <section className="bg-neutral-50 border-b border-neutral-200/10">
 <div className="container mx-auto px-4 py-20 text-center">
 <h1 className="text-4xl md:text-6xl font-extrabold text-neutral-900 tracking-tight mb-6">
 {t('hero_title_line1')}<br />
 <span className="text-accent-yellow">{t('hero_title_line2')}</span>
 </h1>
 <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-10">
 {t('hero_description')}
 </p>

 <div className="max-w-2xl mx-auto">
 {/* Search Type Toggle */}
 <div className="flex justify-center mb-4">
 <div className="bg-neutral-200 p-1 rounded-full inline-flex">
 <button
 onClick={() => { setSearchType('course'); setSearchQuery(''); }}
 className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${searchType ==='course'
 ?'bg-primary-600 text-white shadow-sm'
 :'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/50'
 }`}
 >
 {t('toggle_faculties')}
 </button>
 <button
 onClick={() => { setSearchType('instructor'); setSearchQuery(''); }}
 className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${searchType ==='instructor'
 ?'bg-primary-600 text-white shadow-sm'
 :'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300/50'
 }`}
 >
 {t('toggle_instructors')}
 </button>
 </div>
 </div>

 {/* Search Bar with Dropdown */}
 <div className="relative group search-container">
 <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
 <Search className="w-5 h-5 text-neutral-400 group-focus-within:text-primary-600 transition-colors"/>
 </div>
 <input
 type="text"
 placeholder={searchType ==='course' ? t('search_placeholder') : t('search_instructors_placeholder')}
 className="w-full pl-12 pr-4 py-4 bg-neutral-100 border border-neutral-300 rounded-2xl focus:ring-4 focus:ring-primary-900/20 focus:border-primary-500 transition-all text-lg shadow-sm hover:shadow-md focus:shadow-lg outline-none placeholder:text-neutral-500"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 onFocus={() => searchResults.length > 0 && setShowResults(true)}
 />

 {/* Search Results Dropdown */}
 {showResults && (
 <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-100 border border-neutral-200/20 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
 {isSearching ? (
 <div className="p-4 text-center text-neutral-500">
 {t('searching')}
 </div>
 ) : searchResults.length > 0 ? (
 <div className="py-2">
 {searchResults.map((result) => (
 <Link
 key={result.id}
 href={searchType ==='course' ?`/course/${result.id}` :`/instructor/${result.id}`}
 className="flex items-center justify-between px-4 py-3 hover:bg-neutral-200 transition-colors"
 onClick={() => setShowResults(false)}
 >
 <div className="text-left flex items-center gap-3">
 {searchType ==='instructor' && (
 <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
 <User className="w-4 h-4 text-neutral-500"/>
 </div>
 )}
 <div>
 <p className="font-medium text-neutral-900">{result.name}</p>
 {searchType ==='course' && (
 <p className="text-sm text-neutral-500">
 {result.code} • {getCourseFacultyName(result)}
 </p>
 )}
 </div>
 </div>
 <ChevronRight className="w-4 h-4 text-neutral-400"/>
 </Link>
 ))}
 </div>
 ) : searchQuery.trim().length >= 2 ? (
 <div className="p-4 text-center text-neutral-500">
 {t('no_results')}
 </div>
 ) : null}
 </div>
 )}
 </div>
 </div>
 </div>
 </section>

 {/* Main Content */}
 <div className="container mx-auto px-4 py-12">
 {/* Faculties Grid - Centered */}
 <div className="max-w-4xl mx-auto">
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-xl font-bold text-neutral-900 flex items-center">
 <BookOpen className="w-5 h-5 mr-2 text-primary-600"/>
 {t('faculties_title')}
 </h2>
 </div>

 {loading ? (
 <div className="grid md:grid-cols-2 gap-4">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="h-24 bg-neutral-200 rounded-xl animate-pulse"/>
 ))}
 </div>
 ) : (
 <div className="grid md:grid-cols-2 gap-4">
 {filteredFaculties.map((faculty) => (
 <div key={faculty.id}>
 <Link
 href={`/faculty/${faculty.id}`}
 className="group bg-neutral-100 p-6 rounded-2xl border border-neutral-200/10 hover:border-primary-500 hover:shadow-lg transition-all block"
 >
 <div className="flex items-start justify-between">
 <div>
 <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
 {getFacultyName(faculty)}
 </h3>
 <p className="text-sm text-neutral-500 mt-1">
 {faculty.child_count > 0
 ?`${faculty.child_count} ${locale ==='tr' ?'Bölüm' :'Departments'}`
 :`${faculty.course_count} ${locale ==='tr' ?'Ders' :'Courses'}`}
 </p>
 </div>
 <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-600 transform group-hover:translate-x-1 transition-all"/>
 </div>
 </Link>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Faculty Request Button */}
 <section className="container mx-auto px-4 py-6">
 <div className="max-w-3xl mx-auto text-center">
 <button
 onClick={() => setShowRequestModal(true)}
 className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl"
 >
 <MessageSquarePlus className="w-5 h-5"/>
 {t('faculty_request_button')}
 </button>
 </div>
 </section>

 {/* Disclaimer Section */}
 <section className="container mx-auto px-4 py-12">
 <div className="max-w-3xl mx-auto card p-8">
 <h2 className="text-2xl font-bold text-neutral-900 mb-4">
 {tDisclaimer('title')}
 </h2>
 <div className="space-y-4 text-neutral-600">
 <p>
 <strong>{locale ==='tr' ?'Gizlilik:' :'Privacy:'}</strong> {tDisclaimer('privacy').split(':')[1]}
 </p>
 <p>
 <strong>{locale ==='tr' ?'Kural:' :'Rules:'}</strong> {tDisclaimer('rules').split(':')[1]}
 </p>
 <p>
 <strong>{locale ==='tr' ?'İstatistikler:' :'Statistics:'}</strong> {tDisclaimer('statistics').split(':')[1]}
 </p>
 <p>
 <strong>{locale ==='tr' ?'Sorumluluk:' :'Responsibility:'}</strong> {tDisclaimer('responsibility').split(':')[1]}
 </p>
 </div>
 </div>
 </section>

 {/* Faculty Request Modal */}
 {showRequestModal && (
 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
 <div className="bg-neutral-100 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200/20">
 <div className="p-6">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-xl font-bold text-neutral-900">
 {t('faculty_request_title')}
 </h3>
 <button
 onClick={() => {
 setShowRequestModal(false);
 setSubmitStatus('idle');
 }}
 className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
 >
 <X className="w-5 h-5 text-neutral-500"/>
 </button>
 </div>

 <p className="text-neutral-600 mb-6">
 {t('faculty_request_description')}
 </p>

 {submitStatus ==='success' ? (
 <div className="text-center py-8">
 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <svg className="w-8 h-8 text-green-600"fill="none"stroke="currentColor"viewBox="0 0 24 24">
 <path strokeLinecap="round"strokeLinejoin="round"strokeWidth={2} d="M5 13l4 4L19 7"/>
 </svg>
 </div>
 <p className="text-lg font-medium text-neutral-900 mb-4">
 {t('request_success')}
 </p>
 <button
 onClick={() => {
 setShowRequestModal(false);
 setSubmitStatus('idle');
 }}
 className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
 >
 {t('close')}
 </button>
 </div>
 ) : (
 <form onSubmit={handleRequestSubmit} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-neutral-700 mb-1">
 {t('faculty_name_label')} *
 </label>
 <input
 type="text"
 required
 value={requestForm.facultyName}
 onChange={(e) => setRequestForm(prev => ({ ...prev, facultyName: e.target.value }))}
 placeholder={t('faculty_name_placeholder')}
 className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-neutral-700 mb-1">
 {t('major_name_label')}
 </label>
 <input
 type="text"
 value={requestForm.majorName}
 onChange={(e) => setRequestForm(prev => ({ ...prev, majorName: e.target.value }))}
 placeholder={t('major_name_placeholder')}
 className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-neutral-700 mb-1">
 {t('email_label')}
 </label>
 <input
 type="email"
 value={requestForm.email}
 onChange={(e) => setRequestForm(prev => ({ ...prev, email: e.target.value }))}
 placeholder={t('email_placeholder')}
 className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-neutral-700 mb-1">
 {t('message_label')}
 </label>
 <textarea
 value={requestForm.message}
 onChange={(e) => setRequestForm(prev => ({ ...prev, message: e.target.value }))}
 placeholder={t('message_placeholder')}
 rows={3}
 className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
 />
 </div>

 {submitStatus ==='error' && (
 <p className="text-red-600 text-sm">
 {t('request_error')}
 </p>
 )}

 <button
 type="submit"
 disabled={isSubmitting || !requestForm.facultyName.trim()}
 className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isSubmitting ? t('submitting') : t('submit_request')}
 </button>
 </form>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
