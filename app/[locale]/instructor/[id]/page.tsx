'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { getInstructorById, getCoursesByInstructor, getCourseStats, CourseStats } from '@/lib/utils';
import { Course } from '@/lib/types';
import { ArrowLeft, BookOpen, Star, User, Calendar, MessageSquare, FileText, ChevronRight } from 'lucide-react';

export default function InstructorPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Instructor');
    const tConstants = useTranslations('Constants');
    const tFaculty = useTranslations('Faculty');

    const instructorId = params.id as string;

    const [instructor, setInstructor] = useState<any>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseRatings, setCourseRatings] = useState<Record<string, CourseStats | null>>({});
    const [loading, setLoading] = useState(true);

    // Derive the faculty to navigate back to from the first course
    const backFacultyId = courses.length > 0 ? (courses[0] as any).faculty_id : null;
    const locale = useLocale();
    const backFaculty = courses.length > 0 ? (courses[0] as any).faculties : null;
    const backFacultyName = backFaculty
        ? (locale === 'tr' && backFaculty.name_tr ? backFaculty.name_tr : backFaculty.name)
        : null;

    useEffect(() => {
        loadData();
    }, [instructorId]);

    const loadData = async () => {
        try {
            const [instructorData, coursesData] = await Promise.all([
                getInstructorById(instructorId),
                getCoursesByInstructor(instructorId)
            ]);

            setInstructor(instructorData);
            setCourses(coursesData);

            // Load ratings for courses
            const ratingPromises = coursesData.map(async (course: Course) => {
                const stats = await getCourseStats(course.id);
                return { id: course.id, stats };
            });

            const ratingsData = await Promise.all(ratingPromises);
            const ratingsMap: Record<string, CourseStats | null> = {};
            ratingsData.forEach(({ id, stats }) => {
                ratingsMap[id] = stats;
            });
            setCourseRatings(ratingsMap);

        } catch (error) {
            console.error('Error loading instructor data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-neutral-600">{t('loading') || 'Loading...'}</p>
                </div>
            </div>
        );
    }

    if (!instructor) {
        return (
            <div className="min-h-screen bg-neutral-50 text-neutral-900 flex items-center justify-center">
                <div className="card p-8 text-center bg-neutral-100 border-neutral-200">
                    <User className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600">{t('not_found') || 'Instructor not found'}</p>
                    <button onClick={() => router.push('/')} className="btn btn-primary mt-4">
                        {t('back_to_search')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 ">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Back Button */}
                <button
                    onClick={() => backFacultyId ? router.push(`/faculty/${backFacultyId}`) : router.back()}
                    className="flex items-center space-x-2 text-neutral-500 hover:text-primary-500 mb-6 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors text-base font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{backFacultyName ? backFacultyName : t('back_to_search')}</span>
                </button>

                {/* Instructor Header */}
                <div className="card p-8 mb-8 bg-neutral-100 border-neutral-200">
                    <div className="flex bg-neutral-200 w-20 h-20 rounded-full items-center justify-center mb-4">
                        <User className="w-10 h-10 text-neutral-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                        {instructor.title ? `${instructor.title} ${instructor.name}` : instructor.name}
                    </h1>
                    <p className="text-neutral-500 text-lg">
                        {t('title')}
                    </p>
                </div>

                {/* Instructor Summary Stats */}
                {(() => {
                    const statsEntries = Object.values(courseRatings).filter(Boolean) as CourseStats[];
                    if (statsEntries.length === 0) return null;

                    const totalReviews = statsEntries.reduce((sum, s) => sum + s.total_reviews, 0);
                    const weightedDiff = statsEntries.reduce((sum, s) => sum + s.median_difficulty * s.total_reviews, 0) / totalReviews;
                    const weightedUse = statsEntries.reduce((sum, s) => sum + s.median_usefulness * s.total_reviews, 0) / totalReviews;
                    const weightedWork = statsEntries.reduce((sum, s) => sum + s.median_workload * s.total_reviews, 0) / totalReviews;

                    return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="card p-4 border border-neutral-300 text-center">
                                <div className="text-sm text-neutral-500 mb-1">{t('total_courses') || 'Courses'}</div>
                                <div className="text-3xl font-bold text-neutral-900">{courses.length}</div>
                            </div>
                            <div className="card p-4 border border-neutral-300 text-center">
                                <div className="text-sm text-neutral-500 mb-1">{t('total_reviews') || 'Total Reviews'}</div>
                                <div className="text-3xl font-bold text-neutral-900">{totalReviews}</div>
                            </div>
                            <div className="card p-4 border border-neutral-300 text-center">
                                <div className="text-sm text-neutral-500 mb-1">{t('avg_difficulty') || 'Avg Difficulty'}</div>
                                <div className="text-3xl font-bold text-neutral-900">{weightedDiff.toFixed(1)}</div>
                                <div className="text-xs text-neutral-400">/ 5.0</div>
                            </div>
                            <div className="card p-4 border border-neutral-300 text-center">
                                <div className="text-sm text-neutral-500 mb-1">{t('avg_usefulness') || 'Avg Usefulness'}</div>
                                <div className="text-3xl font-bold text-neutral-900">{weightedUse.toFixed(1)}</div>
                                <div className="text-xs text-neutral-400">/ 5.0</div>
                            </div>
                        </div>
                    );
                })()}

                {/* Courses List */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-6">
                        {t('courses_title', { name: instructor.name })}
                    </h2>

                    {courses.length === 0 ? (
                        <div className="card p-8 text-center bg-neutral-100 border-neutral-200">
                            <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600">{t('no_courses')}</p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {courses.map((course) => {
                                const isZorunlu = course.course_type?.toLowerCase() === 'zorunlu';
                                const isSecmeli = course.course_type?.toLowerCase() === 'seçmeli';

                                // Calculate total rating for this course
                                const stats = courseRatings[course.id];
                                let totalRating = null;
                                if (stats) {
                                    totalRating = ((
                                        (5 - (stats.median_difficulty || 3)) +
                                        (stats.median_usefulness || 3) +
                                        (5 - (stats.median_workload || 3))
                                    ) / 3).toFixed(1);
                                }

                                return (
                                    <button
                                        key={course.id}
                                        onClick={() => router.push(`/course/${course.id}`)}
                                        className={`card p-5 text-left transition-all duration-200 group border-2 rounded-xl block ${isZorunlu
                                            ? 'border-green-600 bg-white hover:bg-green-50 hover:shadow-lg'
                                            : isSecmeli
                                                ? 'border-orange-600 bg-white hover:bg-orange-50 hover:shadow-lg'
                                                : 'border-neutral-200 bg-white hover:border-primary-400 hover:shadow-lg'
                                            }`}
                                    >
                                        {/* Course Name & Code */}
                                        <div className="mb-3">
                                            <h3 className="text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors leading-tight mb-1">
                                                {course.name}
                                            </h3>
                                            <span className="text-base font-mono text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded">
                                                {course.code}
                                            </span>
                                        </div>

                                        {/* Course Type Badge */}
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            {course.course_type && (
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${isZorunlu
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-orange-500 text-white'
                                                    }`}>
                                                    {tConstants(`course_type.${course.course_type.toLowerCase()}`, { fallback: course.course_type })}
                                                </span>
                                            )}
                                            {/* Rating Badge */}
                                            {totalRating && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold bg-primary-100 text-primary-700 border border-primary-200">
                                                    <Star className="w-3.5 h-3.5 mr-1 fill-primary-500 text-primary-500" />
                                                    {totalRating}/5
                                                </span>
                                            )}
                                        </div>

                                        {/* Credits & AKTS */}
                                        <div className="flex items-center gap-4 text-base mb-2">
                                            {course.credit_theory !== undefined && (
                                                <div className="flex items-center text-neutral-700">
                                                    <span className="font-medium">{tFaculty('credits')}: {course.credit_theory}</span>
                                                </div>
                                            )}
                                            {course.ects !== undefined && (
                                                <div className="flex items-center text-neutral-700">
                                                    <span className="font-medium">{tFaculty('ects')}: {course.ects}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Semester */}
                                        {course.semester && (
                                            <div className="flex items-center text-base text-neutral-500">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                <span>{tFaculty('semester_label')}: {course.semester}</span>
                                            </div>
                                        )}

                                        {/* Metrics: Reviews & Files */}
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100">
                                            <div className="flex items-center text-sm font-medium text-neutral-500">
                                                <MessageSquare className="w-4 h-4 mr-1.5" />
                                                {course.reviews?.[0]?.count || 0} {tFaculty('reviews_count_label')}
                                            </div>
                                            <div className="flex items-center text-sm font-medium text-neutral-500">
                                                <FileText className="w-4 h-4 mr-1.5" />
                                                {course.files?.[0]?.count || 0} {tFaculty('files_count_label')}
                                            </div>
                                        </div>

                                        {/* Arrow indicator */}
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="w-5 h-5 text-primary-500" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
