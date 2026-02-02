'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getFaculties } from '@/lib/utils';
import { BookOpen, ChevronRight, ArrowLeft, Building2 } from 'lucide-react';

// Engineering department name patterns to group
const ENGINEERING_PATTERNS = [
    'engineering',
    'mühendislik',
    'computer',
    'electrical',
    'environmental',
    'chemical',
    'bilgisayar',
    'elektrik',
    'çevre',
    'kimya',
];

interface FacultyData {
    id: string;
    name: string;
    course_count?: number;
}

export default function EngineeringPage() {
    const router = useRouter();
    const [faculties, setFaculties] = useState<FacultyData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFaculties();
    }, []);

    const loadFaculties = async () => {
        try {
            const data = await getFaculties(false);
            setFaculties(data);
        } catch (error) {
            console.error('Error loading faculties:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter to only engineering departments with courses
    const engineeringDepartments = useMemo(() => {
        return faculties
            .filter(faculty => {
                const isEngineering = ENGINEERING_PATTERNS.some(pattern =>
                    faculty.name.toLowerCase().includes(pattern)
                );
                return isEngineering && (faculty.course_count || 0) > 0;
            })
            .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    }, [faculties]);

    const totalCourses = engineeringDepartments.reduce((sum, f) => sum + (f.course_count || 0), 0);

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center space-x-2 text-neutral-600 hover:text-primary-600 mb-6 px-3 py-2 bg-neutral-100 hover:bg-primary-50 rounded-lg transition-colors text-base font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Fakülteler</span>
                </button>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                            <Building2 className="w-7 h-7 text-primary-600" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-neutral-900">
                                Mühendislik Fakültesi
                            </h1>
                            <p className="text-neutral-600 mt-1">
                                {engineeringDepartments.length} bölüm • {totalCourses} ders
                            </p>
                        </div>
                    </div>
                    <p className="text-neutral-600">
                        Bölüm seçin ve dersleri görüntüleyin
                    </p>
                </div>

                {/* Departments Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-neutral-600">Bölümler yükleniyor...</p>
                    </div>
                ) : engineeringDepartments.length === 0 ? (
                    <div className="card p-8 text-center">
                        <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                        <p className="text-neutral-600">Henüz bölüm eklenmemiş.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {engineeringDepartments.map((dept) => (
                            <button
                                key={dept.id}
                                onClick={() => router.push(`/faculty/${dept.id}`)}
                                className="card p-6 text-left hover:shadow-md transition-all duration-200 group border-l-4 border-l-primary-500"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors mb-2">
                                            {dept.name}
                                        </h3>
                                        <div className="flex items-center text-sm text-neutral-500">
                                            <BookOpen className="w-4 h-4 mr-1" />
                                            <span>{dept.course_count} ders</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors flex-shrink-0 ml-4 mt-1" />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
