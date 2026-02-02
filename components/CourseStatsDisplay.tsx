'use client';

import { useState, useMemo } from 'react';
import { CourseStats } from '@/lib/utils';
import { DIFFICULTY_VALUE_ALIGNMENT, EXAM_FORMAT } from '@/lib/constants';
import { useTranslations } from 'next-intl';
import { BarChart3 } from 'lucide-react';

interface Props {
  stats: CourseStats;
  reviews?: any[];
}

// Letter grade boundaries based on grading fairness
const calculateGradeBoundaries = (gradingFairness: number) => {
  const adjustment = (gradingFairness - 3) * 5;

  return {
    AA: { lower: Math.max(0, 90 - adjustment * 1.2).toFixed(0), upper: '100' },
    BA: { lower: Math.max(0, 85 - adjustment * 1.1).toFixed(0), upper: Math.max(0, 90 - adjustment * 1.2).toFixed(0) },
    BB: { lower: Math.max(0, 80 - adjustment).toFixed(0), upper: Math.max(0, 85 - adjustment * 1.1).toFixed(0) },
    CB: { lower: Math.max(0, 75 - adjustment * 0.9).toFixed(0), upper: Math.max(0, 80 - adjustment).toFixed(0) },
    CC: { lower: Math.max(0, 70 - adjustment * 0.8).toFixed(0), upper: Math.max(0, 75 - adjustment * 0.9).toFixed(0) },
    DC: { lower: Math.max(0, 65 - adjustment * 0.7).toFixed(0), upper: Math.max(0, 70 - adjustment * 0.8).toFixed(0) },
    DD: { lower: Math.max(0, 60 - adjustment * 0.6).toFixed(0), upper: Math.max(0, 65 - adjustment * 0.7).toFixed(0) },
    FF: { lower: '0', upper: Math.max(0, 60 - adjustment * 0.6).toFixed(0) },
  };
};

export default function CourseStatsDisplay({ stats: initialStats, reviews = [] }: Props) {
  const t = useTranslations('Stats');
  const tConstants = useTranslations('Constants');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  // Group historical data into Final vs Resit (Büt)
  const historyData = useMemo(() => {
    if (!reviews.length) return null;

    const years = [...new Set(reviews
      .filter(r => r.created_at)
      .map(r => new Date(r.created_at).getFullYear())
    )].sort((a, b) => a - b);

    if (years.length < 1) return null;

    const yearlyStats = years.map(year => {
      const yearReviews = reviews.filter(r => new Date(r.created_at).getFullYear() === year);

      const finalReviews = yearReviews.filter(r => {
        const month = new Date(r.created_at).getMonth();
        return month === 0; // January
      });

      const resitReviews = yearReviews.filter(r => {
        const month = new Date(r.created_at).getMonth();
        return month === 1; // February
      });

      const calcStats = (revs: any[]) => {
        if (!revs.length) return null;
        const total = revs.reduce((sum, r) => sum + (r.grading_fairness || 3), 0);
        return {
          avgGrading: total / revs.length,
          count: revs.length
        };
      };

      const finalStats = calcStats(finalReviews);
      const resitStats = calcStats(resitReviews);

      return {
        year,
        final: finalStats ? { ...finalStats, boundaries: calculateGradeBoundaries(finalStats.avgGrading) } : null,
        resit: resitStats ? { ...resitStats, boundaries: calculateGradeBoundaries(resitStats.avgGrading) } : null,
      };
    });

    return { years, yearlyStats };
  }, [reviews]);

  const currentViewStats = useMemo(() => {
    if (selectedYear === 'all') {
      const gradingDist = initialStats.grading_fairness_distribution || {};
      const totalGrading = Object.values(gradingDist).reduce((sum, count) => sum + count, 0);
      const avgGrading = totalGrading > 0
        ? Object.entries(gradingDist).reduce((sum, [rating, count]) => sum + Number(rating) * count, 0) / totalGrading
        : 3;
      return { type: 'overall', boundaries: calculateGradeBoundaries(avgGrading), avgGrading };
    }

    const yearStats = historyData?.yearlyStats.find(y => y.year === selectedYear);
    return { type: 'year', yearStats };
  }, [selectedYear, historyData, initialStats]);

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
      default: return 'bg-neutral-50/5';
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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-6 border border-neutral-300 bg-white">
          <div className="text-base text-neutral-600 mb-1">{t('total_reviews')}</div>
          <div className="text-4xl font-bold text-neutral-900">{initialStats.total_reviews}</div>
        </div>
        <div className="card p-6 border border-neutral-300 bg-white">
          <div className="text-base text-neutral-600 mb-1">{t('median_difficulty')}</div>
          <div className="text-4xl font-bold text-neutral-900">
            {initialStats.median_difficulty.toFixed(1)}
          </div>
          <div className="text-sm text-neutral-500">/ 5.0</div>
        </div>
        <div className="card p-6 border border-neutral-300 bg-white">
          <div className="text-base text-neutral-600 mb-1">{t('median_usefulness')}</div>
          <div className="text-4xl font-bold text-neutral-900">
            {initialStats.median_usefulness.toFixed(1)}
          </div>
          <div className="text-sm text-neutral-500">/ 5.0</div>
        </div>
        <div className="card p-6 border border-neutral-300 bg-white">
          <div className="text-base text-neutral-600 mb-1">{t('median_workload')}</div>
          <div className="text-4xl font-bold text-neutral-900">
            {initialStats.median_workload.toFixed(1)}
          </div>
          <div className="text-sm text-neutral-500">/ 5.0</div>
        </div>
      </div>

      {/* Distributions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 border border-neutral-300 bg-white">
          {renderDistribution(initialStats.difficulty_distribution, t('difficulty_distribution'))}
          {renderDistribution(initialStats.workload_distribution, t('workload_distribution'))}
        </div>
        <div className="card p-6 border border-neutral-300 bg-white">
          {renderDistribution(initialStats.usefulness_distribution, t('usefulness_distribution'))}
          {renderDistribution(initialStats.exam_clarity_distribution, t('exam_clarity_distribution'))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6 border border-neutral-300 bg-white">
          {renderDistribution(initialStats.grading_fairness_distribution || {}, t('grading_fairness'))}
          {renderDistribution(initialStats.attendance_distribution || {}, t('attendance_required'))}
        </div>
        <div className="card p-6 border border-neutral-300 bg-white">
          {renderDistribution(initialStats.material_relevance_distribution || {}, t('material_relevance'))}
          {renderDistribution(initialStats.exam_predictability_distribution || {}, t('exam_predictability'))}
        </div>
      </div>

      {/* Grade History Timeline & Table */}
      <div className="card p-6 border border-neutral-300 bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-neutral-900 flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-primary-600" />
            {t('grade_distribution_by_year')}
          </h3>
          {selectedYear !== 'all' && (
            <button
              onClick={() => setSelectedYear('all')}
              className="text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors"
            >
              {t('overall_view')}
            </button>
          )}
        </div>

        {/* Timeline Visualization */}
        {historyData && (
          <div className="mb-8 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100">
            <div className="flex space-x-4 min-w-max px-1">
              {historyData.years.map((year) => {
                const stats = historyData.yearlyStats.find(s => s.year === year);
                if (!stats) return null;

                const isSelected = selectedYear === year;

                return (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`flex flex-col min-w-[200px] p-4 rounded-xl border transition-all duration-200 text-left ${isSelected
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200'
                      : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50'
                      }`}
                  >
                    <span className={`text-xl font-bold mb-3 ${isSelected ? 'text-primary-700' : 'text-neutral-700'}`}>
                      {year}
                    </span>

                    <div className="grid grid-cols-2 gap-4 w-full">
                      {/* Final Col */}
                      <div>
                        <div className="text-xs uppercase font-bold text-neutral-500 mb-1">{t('final')}</div>
                        {stats.final ? (
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-green-600">
                              AA {Math.round(Number(stats.final.boundaries.AA.lower))}+
                            </div>
                            <div className="text-sm font-semibold text-red-600">
                              FF &lt;{Math.round(Number(stats.final.boundaries.FF.upper))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-400">---</div>
                        )}
                      </div>

                      {/* Resit Col */}
                      <div>
                        <div className="text-xs uppercase font-bold text-neutral-500 mb-1">{t('resit')}</div>
                        {stats.resit ? (
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-green-600">
                              AA {Math.round(Number(stats.resit.boundaries.AA.lower))}+
                            </div>
                            <div className="text-sm font-semibold text-red-600">
                              FF &lt;{Math.round(Number(stats.resit.boundaries.FF.upper))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-neutral-400">---</div>
                        )}
                      </div>
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

        {/* Main Table */}
        <div className="overflow-x-auto border border-neutral-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-lg font-bold text-neutral-800 min-w-[100px]">
                  {t('letter_grade')}
                </th>

                {currentViewStats.type === 'year' && currentViewStats.yearStats ? (
                  <>
                    <th className="px-4 py-3 text-center text-lg font-bold text-neutral-800 border-l border-neutral-200">
                      {t('final_avg')}
                    </th>
                    <th className="px-4 py-3 text-center text-lg font-bold text-neutral-800 border-l border-neutral-200">
                      {t('resit_avg')}
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 text-center text-lg font-bold text-neutral-800">
                      {t('lower_limit')}
                    </th>
                    <th className="px-4 py-3 text-center text-lg font-bold text-neutral-800">
                      {t('upper_limit')}
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentViewStats.type === 'overall' && currentViewStats.boundaries && (
                Object.entries(currentViewStats.boundaries).map(([grade, bounds], index) => {
                  return (
                    <tr key={grade} className={`border-b border-neutral-100 last:border-0 transition-colors ${getGradeRowColor(grade)}`}>
                      <td className={`px-4 py-3 font-bold text-lg border-r border-neutral-100 ${getGradeTextColor(grade)}`}>{grade}</td>
                      <td className="px-4 py-3 text-center text-lg text-neutral-700">{Math.round(Number(bounds.lower))}</td>
                      <td className="px-4 py-3 text-center text-lg text-neutral-700">{bounds.upper === '100' ? '100' : Math.round(Number(bounds.upper))}</td>
                    </tr>
                  )
                })
              )}

              {currentViewStats.type === 'year' && currentViewStats.yearStats && (
                ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FF'].map((grade, index) => {
                  const finalBounds = currentViewStats.yearStats?.final?.boundaries[grade as keyof typeof currentViewStats.yearStats.final.boundaries];
                  const resitBounds = currentViewStats.yearStats?.resit?.boundaries[grade as keyof typeof currentViewStats.yearStats.resit.boundaries];

                  return (
                    <tr key={grade} className={`border-b border-neutral-100 last:border-0 transition-colors ${getGradeRowColor(grade)}`}>
                      <td className={`px-4 py-3 font-bold text-lg border-r border-neutral-100 ${getGradeTextColor(grade)}`}>{grade}</td>
                      <td className="px-4 py-3 text-center text-lg border-l border-neutral-100 text-neutral-700">
                        {finalBounds
                          ? `${Math.round(Number(finalBounds.lower))}-${Math.round(Number(finalBounds.upper))}`
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-lg border-l border-neutral-100 text-neutral-700">
                        {resitBounds
                          ? `${Math.round(Number(resitBounds.lower))}-${Math.round(Number(resitBounds.upper))}`
                          : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
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
        <div className="card p-6 border border-neutral-300 bg-white">
          {renderCategorical(
            initialStats.difficulty_value_counts,
            DIFFICULTY_VALUE_ALIGNMENT,
            t('difficulty_value_balance'),
            'difficulty_value'
          )}
        </div>
        <div className="card p-6 border border-neutral-300 bg-white">
          {renderCategorical(initialStats.exam_format_counts, EXAM_FORMAT, t('exam_format'), 'exam_format')}
        </div>
      </div>
    </div>
  );
}
