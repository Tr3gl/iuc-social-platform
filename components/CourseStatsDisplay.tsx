'use client';

import { useState, useEffect } from 'react';
import { CourseStats, GradeDistribution } from '@/lib/types';
import { getGradeDistributions, submitGradeDistribution } from '@/lib/utils';
import { DIFFICULTY_VALUE_ALIGNMENT, EXAM_FORMAT } from '@/lib/constants';
import { useTranslations } from 'next-intl';
import { BarChart3, Plus, X } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface Props {
    stats: CourseStats;
    reviews?: any[];
    courseId?: string;
}

const GRADES = ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FF'] as const;

const DEFAULT_BOUNDARIES: Record<string, { lower: string; upper: string }> = {
    AA: { lower: '90', upper: '100' },
    BA: { lower: '85', upper: '89' },
    BB: { lower: '80', upper: '84' },
    CB: { lower: '75', upper: '79' },
    CC: { lower: '70', upper: '74' },
    DC: { lower: '65', upper: '69' },
    DD: { lower: '60', upper: '64' },
    FF: { lower: '0', upper: '59' },
};

function distToBoundaries(dist: GradeDistribution): Record<string, { lower: string; upper: string }> {
    return {
        AA: { lower: String(dist.aa_lower), upper: String(dist.aa_upper) },
        BA: { lower: String(dist.ba_lower), upper: String(dist.ba_upper) },
        BB: { lower: String(dist.bb_lower), upper: String(dist.bb_upper) },
        CB: { lower: String(dist.cb_lower), upper: String(dist.cb_upper) },
        CC: { lower: String(dist.cc_lower), upper: String(dist.cc_upper) },
        DC: { lower: String(dist.dc_lower), upper: String(dist.dc_upper) },
        DD: { lower: String(dist.dd_lower), upper: String(dist.dd_upper) },
        FF: { lower: String(dist.ff_lower), upper: String(dist.ff_upper) },
    };
}

export default function CourseStatsDisplay({ stats: initialStats, reviews = [], courseId }: Props) {
    const t = useTranslations('Stats');
    const tConstants = useTranslations('Constants');
    const { user } = useAuth();
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [gradeDistributions, setGradeDistributions] = useState<GradeDistribution[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Load grade distributions from DB
    useEffect(() => {
        if (courseId) {
            getGradeDistributions(courseId)
                .then(setGradeDistributions)
                .catch(console.error);
        }
    }, [courseId]);

    // Group distributions by year
    const yearlyGradeData = gradeDistributions.reduce((acc, dist) => {
        if (!acc[dist.academic_year]) acc[dist.academic_year] = [];
        acc[dist.academic_year].push(dist);
        return acc;
    }, {} as Record<number, GradeDistribution[]>);

    const gradeYears = Object.keys(yearlyGradeData).map(Number).sort((a, b) => a - b);

    // Current view boundaries
    const currentBoundaries = (() => {
        if (selectedYear === 'all') {
            // Show latest available or default
            if (gradeDistributions.length > 0) {
                return distToBoundaries(gradeDistributions[0]); // Most recent (sorted desc)
            }
            return DEFAULT_BOUNDARIES;
        }
        const yearDists = yearlyGradeData[selectedYear];
        if (yearDists && yearDists.length > 0) {
            // Prefer 'final' type
            const finalDist = yearDists.find(d => d.exam_type === 'final') || yearDists[0];
            return distToBoundaries(finalDist);
        }
        return DEFAULT_BOUNDARIES;
    })();

    const isRealData = gradeDistributions.length > 0;

    // Form state
    const [formData, setFormData] = useState({
        academic_year: new Date().getFullYear(),
        semester: 'fall',
        exam_type: 'final',
        aa_lower: 90, aa_upper: 100,
        ba_lower: 85, ba_upper: 89,
        bb_lower: 80, bb_upper: 84,
        cb_lower: 75, cb_upper: 79,
        cc_lower: 70, cc_upper: 74,
        dc_lower: 65, dc_upper: 69,
        dd_lower: 60, dd_upper: 64,
        ff_lower: 0, ff_upper: 59,
    });

    const handleSubmitGrade = async () => {
        if (!courseId) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            const result = await submitGradeDistribution({
                course_id: courseId,
                ...formData,
            });
            setGradeDistributions(prev => [result as GradeDistribution, ...prev]);
            setShowAddForm(false);
        } catch (err: any) {
            setSubmitError(err.message || 'Error submitting');
        } finally {
            setSubmitting(false);
        }
    };

    const getGradeRowColor = (grade: string) => {
        switch (grade) {
            case 'AA': return 'bg-green-500/10 hover:bg-green-500/20';
            case 'BA': return 'bg-green-400/10 hover:bg-green-400/20';
            case 'BB': return 'bg-lime-400/10 hover:bg-lime-400/20';
            case 'CB': return 'bg-yellow-400/10 hover:bg-yellow-400/20';
            case 'CC': return 'bg-amber-400/10 hover:bg-amber-400/20';
            case 'DC': return 'bg-orange-400/10 hover:bg-orange-400/20';
            case 'DD': return 'bg-red-400/10 hover:bg-red-400/20';
            case 'FF': return 'bg-red-600/10 hover:bg-red-600/20';
            default: return 'bg-neutral-50';
        }
    };

    const getGradeTextColor = (grade: string) => {
        switch (grade) {
            case 'AA': return 'text-green-400';
            case 'BA': return 'text-green-400';
            case 'BB': return 'text-lime-400';
            case 'CB': return 'text-yellow-400';
            case 'CC': return 'text-amber-400';
            case 'DC': return 'text-orange-400';
            case 'DD': return 'text-red-400';
            case 'FF': return 'text-red-500';
            default: return 'text-neutral-400';
        }
    };

    const renderDistribution = (distribution: Record<string, number>, title: string) => {
        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

        return (
            <div className="mb-6">
                <h4 className="text-base font-semibold text-neutral-800 mb-3">{title}</h4>
                <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = distribution[rating] || 0;
                        const percentage = total > 0 ? (count / total) * 100 : 0;

                        return (
                            <div key={rating} className="flex items-center space-x-3">
                                <span className="text-base text-neutral-700 w-6 font-medium">{rating}</span>
                                <div className="flex-1 bg-neutral-200 rounded-full h-5 overflow-hidden">
                                    <div
                                        className="h-full bg-accent-yellow transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-base text-neutral-700 w-14 text-right font-medium">
                                    {percentage.toFixed(0)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderCategorical = (
        counts: Record<string, number>,
        labels: Record<string, string>,
        title: string,
        ns: string
    ) => {
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

        return (
            <div className="mb-6">
                <h4 className="text-base font-semibold text-neutral-800 mb-3">{title}</h4>
                <div className="space-y-2">
                    {Object.entries(counts).map(([key, count]) => {
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        const keyName = labels[key as keyof typeof labels] || key;
                        const label = tConstants(`${ns}.${keyName}`);

                        return (
                            <div key={key} className="flex items-center space-x-3">
                                <span className="text-base text-neutral-700 flex-1">{label}</span>
                                <div className="flex-1 bg-neutral-200 rounded-full h-5 overflow-hidden">
                                    <div
                                        className="h-full bg-accent-yellow transition-all duration-300"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-base text-neutral-700 w-14 text-right font-medium">
                                    {percentage.toFixed(0)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-4">
                <div className="card p-6 border border-neutral-300">
                    <div className="text-base text-neutral-600 mb-1">{t('total_reviews')}</div>
                    <div className="text-4xl font-bold text-neutral-900">{initialStats.total_reviews}</div>
                </div>
                <div className="card p-6 border border-neutral-300">
                    <div className="text-base text-neutral-600 mb-1">{t('median_difficulty')}</div>
                    <div className="text-4xl font-bold text-neutral-900">
                        {initialStats.median_difficulty.toFixed(1)}
                    </div>
                    <div className="text-sm text-neutral-500">/ 5.0</div>
                </div>
                <div className="card p-6 border border-neutral-300">
                    <div className="text-base text-neutral-600 mb-1">{t('median_usefulness')}</div>
                    <div className="text-4xl font-bold text-neutral-900">
                        {initialStats.median_usefulness.toFixed(1)}
                    </div>
                    <div className="text-sm text-neutral-500">/ 5.0</div>
                </div>
                <div className="card p-6 border border-neutral-300">
                    <div className="text-base text-neutral-600 mb-1">{t('median_workload')}</div>
                    <div className="text-4xl font-bold text-neutral-900">
                        {initialStats.median_workload.toFixed(1)}
                    </div>
                    <div className="text-sm text-neutral-500">/ 5.0</div>
                </div>
            </div>

            {/* Distributions */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-6 border border-neutral-300">
                    {renderDistribution(initialStats.difficulty_distribution, t('difficulty_distribution'))}
                </div>
                <div className="card p-6 border border-neutral-300">
                    {renderDistribution(initialStats.material_relevance_distribution || {}, t('material_relevance'))}
                </div>
                <div className="card p-6 border border-neutral-300">
                    {renderDistribution(initialStats.workload_distribution, t('workload_distribution'))}
                </div>
                <div className="card p-6 border border-neutral-300">
                    {renderDistribution(initialStats.exam_predictability_distribution || {}, t('exam_predictability'))}
                </div>
                <div className="card p-6 border border-neutral-300">
                    {renderDistribution(initialStats.usefulness_distribution, t('usefulness_distribution'))}
                </div>
                <div className="card p-6 border border-neutral-300">
                    {/* Attendance - Binary Yes/No Display */}
                    {(() => {
                        const dist = initialStats.attendance_distribution || {};
                        const yesCount = dist['5'] || 0;
                        const noCount = dist['1'] || 0;
                        const total = yesCount + noCount;
                        const yesPercent = total > 0 ? Math.round((yesCount / total) * 100) : 0;
                        const noPercent = total > 0 ? Math.round((noCount / total) * 100) : 0;
                        return (
                            <div>
                                <h4 className="text-base font-semibold text-neutral-800 mb-3">{t('attendance_required')}</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-base text-red-600 font-medium w-16">{t('yes_label')}</span>
                                        <div className="flex-1 bg-neutral-200 rounded-full h-5 overflow-hidden">
                                            <div className="h-full bg-red-400 transition-all duration-300" style={{ width: `${yesPercent}%` }} />
                                        </div>
                                        <span className="text-base text-neutral-700 w-14 text-right font-medium">{yesPercent}%</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="text-base text-green-600 font-medium w-16">{t('no_label')}</span>
                                        <div className="flex-1 bg-neutral-200 rounded-full h-5 overflow-hidden">
                                            <div className="h-full bg-green-400 transition-all duration-300" style={{ width: `${noPercent}%` }} />
                                        </div>
                                        <span className="text-base text-neutral-700 w-14 text-right font-medium">{noPercent}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Grade Distribution Table */}
            <div className="card p-6 border border-neutral-300">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-neutral-900 flex items-center">
                        <BarChart3 className="w-6 h-6 mr-2 text-primary-600" />
                        {t('grade_distribution_by_year')}
                    </h3>
                    <div className="flex items-center gap-2">
                        {selectedYear !== 'all' && (
                            <button
                                onClick={() => setSelectedYear('all')}
                                className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
                            >
                                {t('overall_view')}
                            </button>
                        )}
                        {user && courseId && (
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="flex items-center gap-1 text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {showAddForm ? t('cancel') || 'Cancel' : t('add_grade_data') || 'Add Grade Data'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Submission Form */}
                {showAddForm && (
                    <div className="mb-6 p-4 bg-neutral-100 rounded-xl border border-neutral-200">
                        <h4 className="text-base font-semibold text-neutral-800 mb-4">{t('submit_grade_curve') || 'Submit Grade Curve'}</h4>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="text-sm font-medium text-neutral-700 mb-1 block">{t('academic_year') || 'Year'}</label>
                                <input
                                    type="number"
                                    value={formData.academic_year}
                                    onChange={e => setFormData(p => ({ ...p, academic_year: Number(e.target.value) }))}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-neutral-700 mb-1 block">{t('semester_label') || 'Semester'}</label>
                                <select
                                    value={formData.semester}
                                    onChange={e => setFormData(p => ({ ...p, semester: e.target.value }))}
                                    className="input"
                                >
                                    <option value="fall">{t('fall') || 'Fall'}</option>
                                    <option value="spring">{t('spring') || 'Spring'}</option>
                                    <option value="summer">{t('summer') || 'Summer'}</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-neutral-700 mb-1 block">{t('exam_type_label') || 'Exam Type'}</label>
                                <select
                                    value={formData.exam_type}
                                    onChange={e => setFormData(p => ({ ...p, exam_type: e.target.value }))}
                                    className="input"
                                >
                                    <option value="final">{t('final') || 'Final'}</option>
                                    <option value="resit">{t('resit') || 'Resit'}</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {GRADES.map(grade => (
                                <div key={grade} className="flex items-center gap-2">
                                    <span className={`font-bold text-sm w-8 ${getGradeTextColor(grade)}`}>{grade}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={(formData as any)[`${grade.toLowerCase()}_lower`]}
                                        onChange={e => setFormData(p => ({ ...p, [`${grade.toLowerCase()}_lower`]: Number(e.target.value) }))}
                                        className="input text-sm !py-1 !px-2 w-16"
                                        placeholder="Low"
                                    />
                                    <span className="text-neutral-400">-</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={(formData as any)[`${grade.toLowerCase()}_upper`]}
                                        onChange={e => setFormData(p => ({ ...p, [`${grade.toLowerCase()}_upper`]: Number(e.target.value) }))}
                                        className="input text-sm !py-1 !px-2 w-16"
                                        placeholder="High"
                                    />
                                </div>
                            ))}
                        </div>

                        {submitError && <p className="text-red-600 text-sm mb-3">{submitError}</p>}

                        <button
                            onClick={handleSubmitGrade}
                            disabled={submitting}
                            className="btn btn-primary"
                        >
                            {submitting ? (t('submitting') || 'Submitting...') : (t('submit') || 'Submit')}
                        </button>
                    </div>
                )}

                {/* Year Timeline */}
                {gradeYears.length > 0 && (
                    <div className="mb-6 overflow-x-auto pb-4">
                        <div className="flex space-x-3 min-w-max px-1">
                            {gradeYears.map(year => {
                                const yearDists = yearlyGradeData[year];
                                const isSelected = selectedYear === year;
                                const hasFinal = yearDists.some(d => d.exam_type === 'final');
                                const hasResit = yearDists.some(d => d.exam_type === 'resit');

                                return (
                                    <button
                                        key={year}
                                        onClick={() => setSelectedYear(year)}
                                        className={`flex flex-col min-w-[160px] p-4 rounded-xl border transition-all duration-200 text-left ${isSelected
                                            ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                                            : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50'
                                            }`}
                                    >
                                        <span className={`text-xl font-bold mb-2 ${isSelected ? 'text-primary-700' : 'text-neutral-700'}`}>
                                            {year}
                                        </span>
                                        <div className="flex gap-2">
                                            {hasFinal && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">{t('final') || 'Final'}</span>}
                                            {hasResit && <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{t('resit') || 'Resit'}</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="text-xs text-neutral-500 mt-2 text-center">
                            {t('click_year_for_details')}
                        </div>
                    </div>
                )}

                {/* Source indicator */}
                {!isRealData && (
                    <div className="mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                        {t('default_grade_note') || 'Showing default grade boundaries. Log in to submit actual data for this course.'}
                    </div>
                )}

                {/* Main Table */}
                <div className="overflow-x-auto border border-neutral-200 rounded-xl overflow-hidden bg-white">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-neutral-100 border-b border-neutral-200">
                                <th className="px-4 py-3 text-left text-lg font-bold text-neutral-800 min-w-[100px]">
                                    {t('letter_grade')}
                                </th>
                                <th className="px-4 py-3 text-center text-lg font-bold text-neutral-800">
                                    {t('lower_limit')}
                                </th>
                                <th className="px-4 py-3 text-center text-lg font-bold text-neutral-800">
                                    {t('upper_limit')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {GRADES.map(grade => {
                                const bounds = currentBoundaries[grade];
                                return (
                                    <tr key={grade} className={`border-b border-neutral-100 last:border-0 transition-colors ${getGradeRowColor(grade)}`}>
                                        <td className={`px-4 py-3 font-bold text-lg border-r border-neutral-100 ${getGradeTextColor(grade)}`}>{grade}</td>
                                        <td className="px-4 py-3 text-center text-lg text-neutral-700">{bounds.lower}</td>
                                        <td className="px-4 py-3 text-center text-lg text-neutral-700">{bounds.upper}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 bg-primary-50 border border-primary-100 p-4 rounded-lg flex items-start space-x-3">
                    <div className="text-primary-600 mt-0.5 w-5 h-5 flex-shrink-0">ℹ️</div>
                    <div className="text-sm text-neutral-800">
                        <p className="font-semibold mb-1 text-primary-700">
                            {selectedYear === 'all'
                                ? t('showing_overall')
                                : t('year_data_comparison', { year: selectedYear })}
                        </p>
                        <p className="text-neutral-600">
                            {t('grade_curve_note')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-6 border border-neutral-300">
                    {renderCategorical(
                        initialStats.difficulty_value_counts,
                        DIFFICULTY_VALUE_ALIGNMENT,
                        t('difficulty_value_balance'),
                        'difficulty_value'
                    )}
                </div>
                <div className="card p-6 border border-neutral-300">
                    {renderCategorical(initialStats.exam_format_counts, EXAM_FORMAT, t('exam_format'), 'exam_format')}
                </div>
            </div>
        </div>
    );
}
