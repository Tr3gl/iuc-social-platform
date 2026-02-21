'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useTranslations, useLocale } from 'next-intl';
import {
    getCourseById,
    getCourseStats,
    getReviewsByCourse,
    getUserReviewForCourse,
    getFilesByCourse,
    CourseStats,
} from '@/lib/utils';
import { MIN_REVIEWS_FOR_DISPLAY } from '@/lib/constants';
import { ArrowLeft, BarChart3, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import CourseStatsDisplay from '@/components/CourseStatsDisplay';
import ReviewsList from '@/components/ReviewsList';
import FilesList from '@/components/FilesList';

export default function CoursePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const t = useTranslations('Course');
    const locale = useLocale();
    const courseId = params.id as string;

    const [course, setCourse] = useState<any>(null);
    const [stats, setStats] = useState<CourseStats | null>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [userReview, setUserReview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stats' | 'reviews' | 'files'>('stats');

    useEffect(() => {
        loadCourseData();
    }, [courseId, user]);

    const loadCourseData = async () => {
        try {
            const [courseData, statsData, reviewsData, filesData] = await Promise.all([
                getCourseById(courseId),
                getCourseStats(courseId),
                getReviewsByCourse(courseId),
                getFilesByCourse(courseId),
            ]);

            setCourse(courseData);
            setStats(statsData);
            setReviews(reviewsData);
            setFiles(filesData);

            if (user) {
                const userReviewData = await getUserReviewForCourse(user.id, courseId);
                setUserReview(userReviewData);
            }
        } catch (error) {
            console.error('Error loading course data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get localized faculty name
    const getFacultyName = (faculty: any) => {
        if (locale === 'tr' && faculty?.name_tr) {
            return faculty.name_tr;
        }
        return faculty?.name || '';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-neutral-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
                <div className="card p-8 text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600">{t('not_found')}</p>
                    <button onClick={() => router.back()} className="btn btn-primary mt-4">
                        {t('back')}
                    </button>
                </div>
            </div>
        );
    }

    const instructors = (course.course_instructors || [])
        .map((ci: any) => ci.instructors)
        .filter(Boolean);

    const hasEnoughReviews = stats && stats.total_reviews >= MIN_REVIEWS_FOR_DISPLAY;

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900">
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-6xl">
                {/* Back Button */}
                <button
                    onClick={() => router.push(`/faculty/${course.faculty_id}`)}
                    className="flex items-center space-x-2 text-neutral-500 hover:text-amber-600 mb-6 px-3 py-2 bg-white border border-neutral-200 hover:border-amber-300 rounded-lg transition-colors text-base font-medium shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{getFacultyName(course.faculties)}</span>
                </button>

                {/* Course Header */}
                <div className="card p-5 md:p-8 mb-6">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
                            {course.name}
                        </h1>
                        <span className="text-lg font-mono text-neutral-500">
                            {course.code}
                        </span>
                        {/* Total Rating Badge */}
                        {hasEnoughReviews && stats && (
                            <div className="flex items-center bg-amber-50 px-4 py-2 rounded-xl border border-amber-200 shadow-sm ml-auto sm:ml-0">
                                <span className="text-sm font-medium text-amber-800 mr-2">{t('total_rating')}:</span>
                                <span className="text-xl font-bold text-amber-600">
                                    {((
                                        (5 - (stats.median_difficulty || 3)) + // Reverse difficulty (lower is better)
                                        (stats.median_usefulness || 3) +
                                        (5 - (stats.median_workload || 3)) // Reverse workload (lower is better)
                                    ) / 3).toFixed(1)}
                                </span>
                                <span className="text-amber-600 font-medium">/5</span>
                            </div>
                        )}
                    </div>
                </div>

                {instructors.length > 0 && (
                    <div className="card p-6 mb-6">
                        <h3 className="text-lg font-semibold text-neutral-900 mb-3 border-b border-neutral-100 pb-2">
                            {t('instructor_label')}
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {instructors.map((inst: any, index: number) => (
                                <div key={inst.id || index} className="flex items-center">
                                    {inst.id ? (
                                        <Link
                                            href={`/instructor/${inst.id}`}
                                            className="px-4 py-2 bg-neutral-50 hover:bg-amber-50 border border-neutral-200 hover:border-amber-300 rounded-lg transition-all duration-200 text-neutral-700 hover:text-amber-800 font-medium flex items-center group"
                                        >
                                            <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 group-hover:scale-125 transition-transform"></span>
                                            {inst.name}
                                        </Link>
                                    ) : (
                                        <span className="px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-600">
                                            {inst.name}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Review Status */}
                {user && (
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 mt-6 mb-8 border-t border-neutral-200/20">
                        {userReview ? (
                            <div className="flex items-center gap-2">
                                <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200 flex items-center">
                                    ✓ {t('already_reviewed')}
                                </div>
                                <button
                                    onClick={() => router.push(`/course/${courseId}/review`)}
                                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200 hover:border-primary-200"
                                >
                                    {t('edit_review') || 'Edit Review'}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => router.push(`/course/${courseId}/review`)}
                                className="w-full sm:w-auto btn btn-primary flex justify-center items-center"
                            >
                                {t('submit_review')}
                            </button>
                        )}
                        <button
                            onClick={() => router.push(`/course/${courseId}/upload`)}
                            className="w-full sm:w-auto btn btn-secondary flex justify-center items-center"
                        >
                            {t('upload_file')}
                        </button>
                    </div>
                )}

                {!user && (
                    <div className="pt-4 border-t border-neutral-200">
                        <p className="text-sm text-neutral-600 mb-3">
                            {t('login_prompt')}
                        </p>
                        <button
                            onClick={() => router.push('/auth/signin')}
                            className="btn btn-primary"
                        >
                            {t('login_button')}
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className="card mb-6 overflow-hidden">
                    <div className="flex border-b border-neutral-200/20">
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${activeTab === 'stats'
                                ? 'text-accent-yellow border-accent-yellow bg-accent-yellow/5'
                                : 'text-neutral-600 hover:text-neutral-800 border-transparent hover:bg-neutral-200/50'
                                }`}
                        >
                            <BarChart3 className="w-5 h-5" />
                            <span className="hidden sm:inline">{t('tab_stats')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${activeTab === 'reviews'
                                ? 'text-accent-yellow border-accent-yellow bg-accent-yellow/5'
                                : 'text-neutral-600 hover:text-neutral-800 border-transparent hover:bg-neutral-200/50'
                                }`}
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="hidden sm:inline">{t('tab_reviews')}</span>
                            <span className="bg-neutral-200/50 px-2 py-0.5 rounded-full text-xs ml-1.5">{reviews.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-all duration-200 border-b-2 ${activeTab === 'files'
                                ? 'text-accent-yellow border-accent-yellow bg-accent-yellow/5'
                                : 'text-neutral-600 hover:text-neutral-800 border-transparent hover:bg-neutral-200/50'
                                }`}
                        >
                            <FileText className="w-5 h-5" />
                            <span className="hidden sm:inline">{t('tab_files')}</span>
                            <span className="bg-neutral-200/50 px-2 py-0.5 rounded-full text-xs ml-1.5">{files.length}</span>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'stats' && (
                    hasEnoughReviews && stats ? (
                        <CourseStatsDisplay stats={stats} reviews={reviews} courseId={courseId} />
                    ) : (
                        <div className="card p-8 text-center">
                            <BarChart3 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                                {t('not_enough_reviews_title')}
                            </h3>
                            <p className="text-neutral-600">
                                {t('not_enough_reviews_desc')
                                    .replace('{min}', String(MIN_REVIEWS_FOR_DISPLAY))
                                    .replace('{current}', String(stats?.total_reviews || 0))}
                            </p>
                        </div>
                    )
                )}

                {activeTab === 'reviews' && (
                    <ReviewsList reviews={reviews} />
                )}

                {activeTab === 'files' && (
                    <FilesList files={files} courseId={courseId} onUpdate={loadCourseData} />
                )}
            </div>
        </div>
    );
}
