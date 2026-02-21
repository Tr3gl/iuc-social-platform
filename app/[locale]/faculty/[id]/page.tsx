'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { getCoursesByFaculty, getCourseStats, CourseStats, getChildFaculties, getFacultyById, getFacultyParent, getInstructorsByFaculty } from '@/lib/utils';
import { BookOpen, ChevronRight, ArrowLeft, Search, Filter, ArrowUpDown, X, User, BookMarked, Calendar, Star, Building2, MessageSquare, FileText, GraduationCap } from 'lucide-react';
import { Course } from '@/lib/types';
import Link from 'next/link';

export default function FacultyPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Faculty');
    const tConstants = useTranslations('Constants');
    const locale = useLocale();
    const facultyId = params.id as string;

    const [courses, setCourses] = useState<Course[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [faculty, setFaculty] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [courseRatings, setCourseRatings] = useState<Record<string, CourseStats | null>>({});
    const [childDepartments, setChildDepartments] = useState<any[]>([]);
    const [parentFaculty, setParentFaculty] = useState<{ id: string; name: string; name_tr?: string } | null>(null);

    const searchParams = useSearchParams();

    // View Mode:'courses' or 'instructors'
    const [viewMode, setViewMode] = useState<'courses' | 'instructors'>('courses');

    // Read filters from URL params (persistent)
    const searchQuery = searchParams.get('q') || '';
    const [showFilters, setShowFilters] = useState(false);
    const filters = {
        courseType: searchParams.get('courseType') || '',
        classType: searchParams.get('classType') || '',
        semester: searchParams.get('semester') || '',
        instructor: searchParams.get('instructor') || '',
        hasReviews: searchParams.get('hasReviews') === '1',
    };

    // Sort state from URL
    const sortBy = (searchParams.get('sort') as 'name' | 'code' | 'credits' | 'rating' | 'reviews') || 'credits';
    const sortOrder = (searchParams.get('order') as 'asc' | 'desc') || 'desc';

    // Helper to update URL params
    const updateParam = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.replace(`?${params.toString()}`, { scroll: false });
    }, [searchParams, router]);

    const setSearchQuery = (q: string) => updateParam('q', q);
    const setSortBy = (s: string) => updateParam('sort', s);
    const setSortOrder = (o: string) => updateParam('order', o);
    const setFilter = (key: string, value: string) => updateParam(key, value);

    // Get localized name
    const getLocalizedName = (item: any) => {
        if (locale === 'tr' && item?.name_tr) {
            return item.name_tr;
        }
        return item?.name || '';
    };

    useEffect(() => {
        loadFacultyData();
    }, [facultyId]);

    const loadFacultyData = async () => {
        try {
            // First get faculty info with parent
            const facultyInfo = await getFacultyById(facultyId) as any;
            if (facultyInfo) {
                setFaculty(facultyInfo);

                // ROBUST PARENT FETCHING
                if (facultyInfo.parent && facultyInfo.parent.id) {
                    setParentFaculty(facultyInfo.parent);
                } else if (facultyInfo.parent_id) {
                    const parentData = await getFacultyParent(facultyInfo.parent_id);
                    setParentFaculty(parentData);
                } else {
                    setParentFaculty(null);
                }
            }

            // Check if this faculty has child departments
            const children = await getChildFaculties(facultyId);
            if (children && children.length > 0) {
                setChildDepartments(children);
            } else {
                // No children, load courses and instructors
                await Promise.all([loadCourses(), loadInstructors()]);
            }
        } catch (error) {
            console.error('Error loading faculty data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCourses = async () => {
        try {
            const data = await getCoursesByFaculty(facultyId);
            setCourses(data);

            // Load ratings for all courses in parallel
            const ratingPromises = data.map(async (course: Course) => {
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
            console.error('Error loading courses:', error);
        }
    };

    const loadInstructors = async () => {
        try {
            const data = await getInstructorsByFaculty(facultyId);
            setInstructors(data);
        } catch (error) {
            console.error('Error loading instructors:', error);
        }
    };

    // Extract unique filter options from courses
    const filterOptions = useMemo(() => {
        const courseTypes = [...new Set(courses.map(c => c.course_type).filter(Boolean))];
        const classTypes = [...new Set(courses.map(c => c.class_type).filter(Boolean))];
        const semesters = [...new Set(courses.map(c => c.semester).filter(Boolean))];
        const instructors = [...new Set(
            courses.flatMap(c => (c.course_instructors || []).map(ci => ci.instructors ? (ci.instructors.title ? `${ci.instructors.title} ${ci.instructors.name}` : ci.instructors.name) : null).filter(Boolean) as string[])
        )];
        return { courseTypes, classTypes, semesters, instructors };
    }, [courses]);

    // Filtered and sorted courses
    const filteredCourses = useMemo(() => {
        let result = courses.filter(course => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                course.name.toLowerCase().includes(searchLower) ||
                course.code.toLowerCase().includes(searchLower) ||
                (course.course_instructors || []).some(ci => {
                    const fullName = ci.instructors ? (ci.instructors.title ? `${ci.instructors.title} ${ci.instructors.name}` : ci.instructors.name) : '';
                    return fullName.toLowerCase().includes(searchLower);
                });

            // Other filters
            const matchesCourseType = !filters.courseType || course.course_type === filters.courseType;
            const matchesClassType = !filters.classType || course.class_type === filters.classType;
            const matchesSemester = !filters.semester || String(course.semester) === filters.semester;
            const matchesInstructor = !filters.instructor ||
                (course.course_instructors || []).some(ci => {
                    const fullName = ci.instructors ? (ci.instructors.title ? `${ci.instructors.title} ${ci.instructors.name}` : ci.instructors.name) : '';
                    return fullName === filters.instructor;
                });

            // Has reviews filter
            const matchesHasReviews = !filters.hasReviews || (course.reviews?.[0]?.count || 0) > 0;

            return matchesSearch && matchesCourseType && matchesClassType && matchesSemester && matchesInstructor && matchesHasReviews;
        });

        // Sort
        result.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'code':
                    comparison = a.code.localeCompare(b.code);
                    break;
                case 'credits':
                    comparison = (a.credit_theory || 0) - (b.credit_theory || 0);
                    break;
                case 'rating': {
                    const ratingA = courseRatings[a.id];
                    const ratingB = courseRatings[b.id];
                    const scoreA = ratingA ? ((5 - (ratingA.median_difficulty || 3)) + (ratingA.median_usefulness || 3) + (5 - (ratingA.median_workload || 3))) / 3 : 0;
                    const scoreB = ratingB ? ((5 - (ratingB.median_difficulty || 3)) + (ratingB.median_usefulness || 3) + (5 - (ratingB.median_workload || 3))) / 3 : 0;
                    comparison = scoreA - scoreB;
                    break;
                }
                case 'reviews':
                    comparison = (a.reviews?.[0]?.count || 0) - (b.reviews?.[0]?.count || 0);
                    break;
                default:
                    comparison = a.name.localeCompare(b.name, locale);
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [courses, searchQuery, filters, sortBy, sortOrder, locale, courseRatings]);

    // Filtered Instructors
    const filteredInstructors = useMemo(() => {
        if (!searchQuery) return instructors;
        const lowerQuery = searchQuery.toLowerCase();
        return instructors.filter(inst => {
            const fullName = inst.title ? `${inst.title} ${inst.name}` : inst.name;
            return fullName.toLowerCase().includes(lowerQuery);
        });
    }, [instructors, searchQuery]);

    const activeFilterCount = Object.entries(filters).filter(([k, v]) => k !== 'hasReviews' ? Boolean(v) : v === true).length;

    const clearFilters = () => {
        router.replace(`?`, { scroll: false });
    };

    const handleBack = () => {
        if (parentFaculty && parentFaculty.id) {
            router.push(`/faculty/${parentFaculty.id}`);
        } else {
            router.push('/');
        }
    };

    const facultyName = getLocalizedName(faculty) || t('faculty_default');

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 ">
            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <button
                    onClick={handleBack}
                    className="flex items-center space-x-2 text-neutral-500 hover:text-primary-500 mb-6 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors text-base font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>{parentFaculty?.id ? getLocalizedName(parentFaculty) : t('back_to_faculties')}</span>
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-2">
                        {facultyName}
                    </h1>
                    <p className="text-neutral-600">
                        {childDepartments.length > 0
                            ? t('departments_count', { count: childDepartments.length })
                            : viewMode === 'courses'
                                ? t('courses_count', { filtered: filteredCourses.length, total: courses.length })
                                : `${filteredInstructors.length} ${t('tab_instructors')}`
                        }
                    </p>
                </div>

                {/* Tabs - Only show if no child departments */}
                {childDepartments.length === 0 && (
                    <div className="flex border-b border-neutral-200 mb-6">
                        <button
                            onClick={() => setViewMode('courses')}
                            className={`px-6 py-3 font-medium text-lg border-b-2 transition-colors flex items-center gap-2 ${viewMode === 'courses'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            <BookOpen className="w-5 h-5" />
                            {t('tab_courses')}
                        </button>
                        <button
                            onClick={() => setViewMode('instructors')}
                            className={`px-6 py-3 font-medium text-lg border-b-2 transition-colors flex items-center gap-2 ${viewMode === 'instructors'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                }`}
                        >
                            <GraduationCap className="w-5 h-5" />
                            {t('tab_instructors')}
                        </button>
                    </div>
                )}

                {/* Search and Filter Bar */}
                {childDepartments.length === 0 && (
                    <div className="card p-4 mb-6 bg-neutral-100 border-neutral-200">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder={t('search_placeholder')}
                                    value={searchQuery || ''}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-neutral-900 placeholder-neutral-500 "
                                />
                            </div>

                            {/* Filters - Only for Courses */}
                            {viewMode === 'courses' && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center space-x-2`}
                                    >
                                        <Filter className="w-4 h-4" />
                                        <span>{t('filters')}</span>
                                        {activeFilterCount > 0 && (
                                            <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </button>

                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="input py-2 bg-neutral-200 border-neutral-300 text-neutral-900 focus:bg-neutral-50 flex-1 min-w-0"
                                        >
                                            <option value="name">{t('sort_by_name')}</option>
                                            <option value="code">{t('sort_by_code')}</option>
                                            <option value="credits">{t('sort_by_credits')}</option>
                                            <option value="rating">{t('sort_by_rating')}</option>
                                            <option value="reviews">{t('sort_by_reviews')}</option>
                                        </select>
                                        <button
                                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                            className="btn btn-secondary p-2 flex-shrink-0"
                                            title={sortOrder === 'asc' ? t('ascending') : t('descending')}
                                        >
                                            <ArrowUpDown className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Expanded Filters - Only for Courses */}
                        {viewMode === 'courses' && showFilters && (
                            <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">{t('course_type')}</label>
                                    <select
                                        value={filters.courseType || ''}
                                        onChange={(e) => setFilter('courseType', e.target.value)}
                                        className="input w-full bg-neutral-200 border-neutral-300 text-neutral-900 focus:bg-neutral-50 "
                                    >
                                        <option value="">{t('all')}</option>
                                        {filterOptions.courseTypes.map(type => (
                                            <option key={type} value={type || ''}>{tConstants(`course_type.${(type || '').toLowerCase()}`, { fallback: type || '' })}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">{t('class_type')}</label>
                                    <select
                                        value={filters.classType || ''}
                                        onChange={(e) => setFilter('classType', e.target.value)}
                                        className="input w-full bg-neutral-200 border-neutral-300 text-neutral-900 focus:bg-neutral-50 "
                                    >
                                        <option value="">{t('all')}</option>
                                        {filterOptions.classTypes.map(type => (
                                            <option key={type} value={type || ''}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">{t('semester')}</label>
                                    <select
                                        value={filters.semester || ''}
                                        onChange={(e) => setFilter('semester', e.target.value)}
                                        className="input w-full bg-neutral-200 border-neutral-300 text-neutral-900 focus:bg-neutral-50 "
                                    >
                                        <option value="">{t('all')}</option>
                                        {filterOptions.semesters.map(sem => (
                                            <option key={sem} value={sem ?? ''}>{sem}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">{t('instructor')}</label>
                                    <select
                                        value={filters.instructor || ''}
                                        onChange={(e) => setFilter('instructor', e.target.value)}
                                        className="input w-full bg-neutral-200 border-neutral-300 text-neutral-900 focus:bg-neutral-50 "
                                    >
                                        <option value="">{t('all')}</option>
                                        {filterOptions.instructors.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center col-span-2 md:col-span-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.hasReviews}
                                            onChange={(e) => setFilter('hasReviews', e.target.checked ? '1' : '')}
                                            className="w-4 h-4 text-primary-600 rounded border-neutral-300 focus:ring-primary-500"
                                        />
                                        <span className="text-sm font-medium text-neutral-700">{t('has_reviews') || 'Has Reviews Only'}</span>
                                    </label>
                                </div>
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="col-span-2 md:col-span-4 text-sm text-red-600 hover:text-red-700 flex items-center justify-center space-x-1"
                                    >
                                        <X className="w-4 h-4" />
                                        <span>{t('clear_filters')}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Content Area */}
                {childDepartments.length > 0 ? (
                    /* Department Grid */
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {childDepartments.map((dept: any) => (
                            <button
                                key={dept.id}
                                onClick={() => router.push(`/faculty/${dept.id}`)}
                                className="card p-6 text-left hover:shadow-lg transition-all duration-200 group border-2 border-neutral-200 hover:border-primary-400 "
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">
                                                {getLocalizedName(dept)}
                                            </h3>
                                            <p className="text-sm text-neutral-500 mt-1">
                                                {dept.course_count || 0} {t('courses')}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" />
                                </div>
                            </button>
                        ))}
                    </div>
                ) : loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-neutral-600">{t('loading_courses')}</p>
                    </div>
                ) : viewMode === 'courses' ? (
                    /* Courses Grid */
                    filteredCourses.length === 0 ? (
                        <div className="card p-8 text-center">
                            <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600">
                                {courses.length === 0
                                    ? t('no_courses_added')
                                    : t('no_courses_match')}
                            </p>
                            {activeFilterCount > 0 && (
                                <button onClick={clearFilters} className="mt-4 text-primary-600 hover:underline">
                                    {t('clear_filters_link')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
                            {filteredCourses.map((course) => {
                                const instructors = (course.course_instructors || [])
                                    .map((ci) => ci.instructors ? (ci.instructors.title ? `${ci.instructors.title} ${ci.instructors.name}` : ci.instructors.name) : null)
                                    .filter(Boolean);

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
                                    <Link
                                        key={course.id}
                                        href={`/course/${course.id}`}
                                        className={`card p-3 md:p-5 text-left transition-all duration-200 group border-2 rounded-xl block ${isZorunlu
                                            ? 'border-green-600 bg-white hover:bg-green-50 hover:shadow-lg'
                                            : isSecmeli
                                                ? 'border-orange-600 bg-white hover:bg-orange-50 hover:shadow-lg'
                                                : 'border-neutral-200 bg-white hover:border-primary-400 hover:shadow-lg'
                                            }`}
                                    >
                                        {/* Course Name & Code */}
                                        <div className="mb-2 md:mb-3">
                                            <h3 className="text-base md:text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors leading-tight mb-1">
                                                {course.name}
                                            </h3>
                                            <span className="text-sm md:text-base font-mono text-neutral-500 bg-neutral-200 px-2 py-0.5 rounded">
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

                                        {/* Instructor */}
                                        {instructors.length > 0 && (
                                            <div className="flex items-center text-sm md:text-base text-neutral-600 mb-2 md:mb-3">
                                                <User className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1.5 md:mr-2 text-neutral-400 flex-shrink-0" />
                                                <span className="truncate">{instructors.join(',')}</span>
                                            </div>
                                        )}

                                        {/* Credits & AKTS */}
                                        <div className="flex items-center gap-3 md:gap-4 text-sm md:text-base mb-2">
                                            {course.credit_theory !== undefined && (
                                                <div className="flex items-center text-neutral-700">
                                                    <BookMarked className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1 text-primary-500" />
                                                    <span className="font-medium">{t('credits')}: {course.credit_theory}</span>
                                                </div>
                                            )}
                                            {course.ects !== undefined && (
                                                <div className="flex items-center text-neutral-700">
                                                    <span className="font-medium">{t('ects')}: {course.ects}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Semester */}
                                        {course.semester && (
                                            <div className="flex items-center text-sm md:text-base text-neutral-500">
                                                <Calendar className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1" />
                                                <span>{t('semester_label')}: {course.semester}</span>
                                            </div>
                                        )}

                                        {/* Metrics: Reviews & Files */}
                                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100">
                                            <div className="flex items-center text-sm font-medium text-neutral-500">
                                                <MessageSquare className="w-4 h-4 mr-1.5" />
                                                {course.reviews?.[0]?.count || 0} {t('reviews_count_label', { count: course.reviews?.[0]?.count || 0, fallback: 'Reviews' })}
                                            </div>
                                            <div className="flex items-center text-sm font-medium text-neutral-500">
                                                <FileText className="w-4 h-4 mr-1.5" />
                                                {course.files?.[0]?.count || 0} {t('files_count_label', { count: course.files?.[0]?.count || 0, fallback: 'Files' })}
                                            </div>
                                        </div>

                                        {/* Arrow indicator */}
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ChevronRight className="w-5 h-5 text-primary-500" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )
                ) : (
                    /* Instructors Grid */
                    filteredInstructors.length === 0 ? (
                        <div className="card p-8 text-center">
                            <User className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                            <p className="text-neutral-600">
                                {t('no_courses_match')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredInstructors.map((inst) => (
                                <Link
                                    key={inst.id}
                                    href={`/instructor/${inst.id}`}
                                    className="card p-6 flex flex-col items-center text-center hover:shadow-lg transition-all duration-200 group border-2 border-neutral-200/50 hover:border-primary-500/50 bg-neutral-100"
                                >
                                    <div className="w-20 h-20 bg-neutral-200 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-100 transition-colors">
                                        <User className="w-10 h-10 text-neutral-500 group-hover:text-primary-600 transition-colors" />
                                    </div>
                                    <h3 className="text-xl font-bold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                                        {inst.title ? `${inst.title} ${inst.name}` : inst.name}
                                    </h3>
                                    <p className="text-sm text-neutral-500 mb-4 px-3 py-1 bg-neutral-200 rounded-full">
                                        {inst.course_count || 0} {t('tab_courses')}
                                    </p>

                                    <div className="mt-auto w-full pt-4 border-t border-neutral-200">
                                        <span className="text-sm font-medium text-primary-600 flex items-center justify-center gap-1">
                                            {t('tab_courses')} <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
