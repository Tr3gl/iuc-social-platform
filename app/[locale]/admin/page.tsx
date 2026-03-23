'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  getReviewReports,
  getFileReports,
  getPendingTags,
  updatePendingTagStatus,
  getPendingSurvivalGuides,
  updateSurvivalGuideStatus,
  getAllReviews,
  getTrollReviews,
  deleteReview,
  getPendingFiles,
  verifyFile,
  rejectFile,
  uploadFileAsAdmin
} from '@/lib/utils';
import { FILE_TYPES } from '@/lib/constants';
import {
  Flag,
  FileText,
  Tag,
  Check,
  X,
  ArrowLeft,
  AlertTriangle,
  Clock,
  MessageSquare,
  Shield,
  Lock,
  ChevronDown,
  ChevronRight,
  Trash2,
  Eye,
  Users,
  ExternalLink,
  BookOpen,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import {
  approvePendingTag,
  rejectPendingTag,
  deleteReview as deleteReviewAction,
  approveFile as approveFileAction,
  rejectFile as rejectFileAction,
  approveSurvivalGuide,
  rejectSurvivalGuide,
  getAllTags as fetchAllTags,
  createTag as createTagAction,
  updateTag as updateTagAction,
  deleteTag as deleteTagAction,
  verifyAdminStatus,
  getAllCourses,
  getAllFaculties,
  createCourse,
  updateCourse,
  deleteCourse
} from '@/app/actions';
import { Edit2, Plus } from 'lucide-react';

type TopicType = 'pending_guides' | 'all_reviews' | 'reports' | 'troll_reviews' | 'pending_tags' | 'pending_files' | 'tag_management' | 'course_management';

interface TopicData {
  id: TopicType;
  title: string;
  icon: React.ReactNode;
  description: string;
  count: number;
  color: string;
}

export default function AdminPage() {
  const router = useRouter();
  const t = useTranslations('Admin');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  
  const [expandedTopic, setExpandedTopic] = useState<TopicType | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');

  // Data states
  const [pendingFiles, setPendingFiles] = useState<any[]>([]);
  const [pendingGuides, setPendingGuides] = useState<any[]>([]);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [reviewReports, setReviewReports] = useState<any[]>([]);
  const [fileReports, setFileReports] = useState<any[]>([]);
  const [trollReviews, setTrollReviews] = useState<any[]>([]);
  const [pendingTags, setPendingTags] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [allCoursesData, setAllCoursesData] = useState<any[]>([]);
  const [allFacultiesData, setAllFacultiesData] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Check Auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await verifyAdminStatus();
        setIsAuthenticated(isAuth);
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    router.push('/');
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [guides, reviews, revReports, fReports, trolls, tags, files, existingTags, courses, faculties] = await Promise.all([
        getPendingSurvivalGuides('pending'),
        getAllReviews(),
        getReviewReports(),
        getFileReports(),
        getTrollReviews(3),
        getPendingTags('pending'),
        getPendingFiles(),
        fetchAllTags(),
        getAllCourses(),
        getAllFaculties(),
      ]);
      setPendingGuides(guides);
      setAllReviews(reviews);
      setReviewReports(revReports);
      setFileReports(fReports);
      setTrollReviews(trolls);
      setPendingTags(tags);
      setPendingFiles(files);
      setAllTags(existingTags);
      setAllCoursesData(courses);
      setAllFacultiesData(faculties);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuideAction = async (guideId: string, action: 'approved' | 'rejected') => {
    setProcessingId(guideId);
    try {
      if (action === 'approved') {
        await approveSurvivalGuide(guideId);
      } else {
        await rejectSurvivalGuide(guideId);
      }
      setPendingGuides(prev => prev.filter(g => g.id !== guideId));
    } catch (error) {
      alert('Error updating survival guide');
    } finally {
      setProcessingId(null);
    }
  };

  const handleTagAction = async (tagId: string, action: 'approved' | 'rejected', newData?: { name: string; type: 'positive' | 'negative' }) => {
    setProcessingId(tagId);
    try {
      if (action === 'approved') {
        await approvePendingTag(tagId, newData);
      } else {
        await rejectPendingTag(tagId);
      }
      setPendingTags(prev => prev.filter(t => t.id !== tagId));
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleFileAction = async (fileId: string, filePath: string, action: 'approved' | 'rejected') => {
    setProcessingId(fileId);
    try {
      if (action === 'approved') {
        await approveFileAction(fileId);
      } else {
        await rejectFileAction(fileId, filePath);
      }
      setPendingFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      alert('Error updating file');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm(t('content.delete_confirm'))) return;

    setProcessingId(reviewId);
    try {
      await deleteReviewAction(reviewId);
      setAllReviews(prev => prev.filter(r => r.id !== reviewId));
      setTrollReviews(prev => prev.filter(r => r.id !== reviewId));
    } catch (error) {
      alert('Silme işlemi başarısız.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered views
  const filteredFiles = useMemo(() => {
    if (selectedFaculty === 'all') return pendingFiles;
    return pendingFiles.filter(f => f.courses?.faculty_id === selectedFaculty);
  }, [pendingFiles, selectedFaculty]);

  const filteredGuides = useMemo(() => {
    if (selectedFaculty === 'all') return pendingGuides;
    return pendingGuides.filter(g => g.courses?.faculty_id === selectedFaculty);
  }, [pendingGuides, selectedFaculty]);

  const filteredReviews = useMemo(() => {
    if (selectedFaculty === 'all') return allReviews;
    return allReviews.filter(r => r.courses?.faculty_id === selectedFaculty);
  }, [allReviews, selectedFaculty]);

  const filteredReviewReports = useMemo(() => {
    if (selectedFaculty === 'all') return reviewReports;
    return reviewReports.filter(r => r.reviews?.courses?.faculty_id === selectedFaculty);
  }, [reviewReports, selectedFaculty]);

  const filteredFileReports = useMemo(() => {
    if (selectedFaculty === 'all') return fileReports;
    return fileReports.filter(r => r.files?.courses?.faculty_id === selectedFaculty);
  }, [fileReports, selectedFaculty]);

  const filteredTrolls = useMemo(() => {
    if (selectedFaculty === 'all') return trollReviews;
    return trollReviews.filter(r => r.courses?.faculty_id === selectedFaculty);
  }, [trollReviews, selectedFaculty]);

  const selectedFacultyObj = allFacultiesData.find(f => f.id === selectedFaculty);

  const topics: TopicData[] = [
    {
      id: 'pending_files',
      title: t('topics.pending_files'),
      icon: <FileText className="w-6 h-6" />,
      description: t('topics.pending_files_desc'),
      count: filteredFiles.length,
      color: 'teal'
    },
    {
      id: 'pending_guides',
      title: t('topics.pending_guides'),
      icon: <Clock className="w-6 h-6" />,
      description: t('topics.pending_guides_desc'),
      count: filteredGuides.length,
      color: 'amber'
    },
    {
      id: 'all_reviews',
      title: selectedFaculty === 'all' ? t('topics.all_reviews') : t('topics.filtered_reviews', { major: selectedFacultyObj?.name || '' }),
      icon: <MessageSquare className="w-6 h-6" />,
      description: t('topics.all_reviews_desc'),
      count: filteredReviews.length,
      color: 'blue'
    },
    {
      id: 'reports',
      title: t('topics.reports'),
      icon: <Flag className="w-6 h-6" />,
      description: t('topics.reports_desc'),
      count: filteredReviewReports.length + filteredFileReports.length,
      color: 'red'
    },
    {
      id: 'troll_reviews',
      title: t('topics.troll_reviews'),
      icon: <AlertTriangle className="w-6 h-6" />,
      description: t('topics.troll_reviews_desc'),
      count: filteredTrolls.length,
      color: 'orange'
    },
    {
      id: 'course_management',
      title: t('topics.course_management'),
      icon: <BookOpen className="w-6 h-6" />,
      description: t('topics.course_management_desc'),
      count: allCoursesData.length,
      color: 'teal'
    },
    {
      id: 'pending_tags',
      title: t('topics.pending_tags'),
      icon: <Tag className="w-6 h-6" />,
      description: t('topics.pending_tags_desc'),
      count: pendingTags.length,
      color: 'purple'
    },
    {
      id: 'tag_management',
      title: t('topics.tag_management'),
      icon: <Edit2 className="w-6 h-6" />,
      description: t('topics.tag_management_desc'),
      count: allTags.length,
      color: 'blue'
    }
  ];

  if (isChecking) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 bg-white/95 backdrop-blur shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t('access_denied_title')}</h1>
          <p className="text-neutral-600 mb-6">{t('access_denied_desc')}</p>
          <button onClick={() => router.push('/')} className="btn btn-primary w-full flex justify-center items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('home_button')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 ">
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push('/')} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-primary-600" />
              <h1 className="text-xl font-bold text-neutral-900">{t('title')}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select 
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="px-3 py-1.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm font-medium bg-neutral-50"
            >
              <option value="all">{t('all_majors')}</option>
              {allFacultiesData.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <button onClick={handleLogout} className="btn btn-ghost text-sm text-red-600 hover:bg-red-50">
              {t('logout_button')}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-neutral-600">{t('loading')}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <div key={topic.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                  className={`w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors ${expandedTopic === topic.id ? 'bg-neutral-50' : ''}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      topic.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                      topic.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                      topic.color === 'red' ? 'bg-red-100 text-red-600' :
                      topic.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                      topic.color === 'teal' ? 'bg-teal-100 text-teal-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {topic.icon}
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-neutral-900">{topic.title}</h2>
                      <p className="text-sm text-neutral-500">{topic.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      topic.count === 0 ? 'bg-neutral-100 text-neutral-500' :
                       topic.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                       topic.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                       topic.color === 'red' ? 'bg-red-100 text-red-700' :
                       topic.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                       topic.color === 'teal' ? 'bg-teal-100 text-teal-700' :
                       'bg-purple-100 text-purple-700'
                    }`}>
                      {topic.count}
                    </span>
                    {expandedTopic === topic.id ? (
                      <ChevronDown className="w-5 h-5 text-neutral-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                </button>

                {expandedTopic === topic.id && (
                  <div className="border-t border-neutral-100 p-6 bg-white ">
                    {topic.id === 'pending_files' && <PendingFilesContent files={filteredFiles} onAction={handleFileAction} processingId={processingId} t={t} />}
                    {topic.id === 'pending_guides' && <PendingGuidesContent guides={filteredGuides} onAction={handleGuideAction} processingId={processingId} t={t} />}
                    {topic.id === 'all_reviews' && <AllReviewsContent reviews={filteredReviews} onDelete={handleDeleteReview} processingId={processingId} t={t} />}
                    {topic.id === 'reports' && <ReportsContent reviewReports={filteredReviewReports} fileReports={filteredFileReports} onDeleteReview={handleDeleteReview} processingId={processingId} t={t} />}
                    {topic.id === 'troll_reviews' && <TrollReviewsContent reviews={filteredTrolls} onDelete={handleDeleteReview} processingId={processingId} t={t} />}
                    {topic.id === 'pending_tags' && <PendingTagsContent tags={pendingTags} onAction={handleTagAction} processingId={processingId} t={t} />}
                    {topic.id === 'course_management' && <CourseManagementContent courses={allCoursesData} faculties={allFacultiesData} onRefresh={async () => {
                      const [c, f] = await Promise.all([getAllCourses(), getAllFaculties()]);
                      setAllCoursesData(c);
                      setAllFacultiesData(f);
                    }} processingId={processingId} setProcessingId={setProcessingId} t={t} />}
                    {topic.id === 'tag_management' && <TagManagementContent tags={allTags} onRefresh={async () => {
                      const updated = await fetchAllTags();
                      setAllTags(updated);
                    }} processingId={processingId} setProcessingId={setProcessingId} t={t} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-components
function PendingFilesContent({ files, onAction, processingId, t }: any) {
  if (files.length === 0) return <p className="text-neutral-500 text-center py-4">{t('content.no_pending_files')}</p>;
  return (
    <div className="space-y-4">
      {files.map((file: any) => (
        <div key={file.id} className="p-4 border border-neutral-200 rounded-lg flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <span className="uppercase text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">{file.type}</span>
              <p className="font-medium text-neutral-800">{file.file_name}</p>
            </div>
            <p className="text-sm text-neutral-600 mb-1">{file.courses?.name} ({file.courses?.code})</p>
            <div className="flex items-center space-x-4 text-xs text-neutral-400 mt-2">
              <span>{new Date(file.created_at).toLocaleDateString()}</span>
              <a href={file.file_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline flex items-center">
                <ExternalLink className="w-3 h-3 mr-1" /> {t('content.view_file')}
              </a>
            </div>
          </div>
          <div className="flex space-x-2 ml-4">
            <button onClick={() => onAction(file.id, file.file_path, 'approved')} disabled={processingId === file.id} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check className="w-4 h-4" /></button>
            <button onClick={() => onAction(file.id, file.file_path, 'rejected')} disabled={processingId === file.id} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PendingGuidesContent({ guides, onAction, processingId, t }: any) {
  if (guides.length === 0) return <p className="text-neutral-500 text-center py-4">{t('content.no_pending_guides')}</p>;
  return (
    <div className="space-y-4">
      {guides.map((guide: any) => (
        <div key={guide.id} className="p-4 border border-neutral-200 rounded-lg flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium text-neutral-800 mb-1">{guide.courses?.name} ({guide.courses?.code})</p>
            <p className="text-neutral-600 italic">"{guide.survival_guide}"</p>
          </div>
          <div className="flex space-x-2 ml-4">
            <button onClick={() => onAction(guide.id, 'approved')} disabled={processingId === guide.id} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check className="w-4 h-4" /></button>
            <button onClick={() => onAction(guide.id, 'rejected')} disabled={processingId === guide.id} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllReviewsContent({ reviews, onDelete, processingId, t }: any) {
  if (reviews.length === 0) return <p className="text-neutral-500 text-center py-4">{t('content.no_reviews')}</p>;
  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto">
      {reviews.slice(0, 50).map((review: any) => (
        <div key={review.id} className="p-4 border border-neutral-200 rounded-lg flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium text-neutral-800">{review.courses?.name} ({review.courses?.code})</p>
            <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{review.comment || '-'}</p>
            <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-400">
              <span>{t('content.difficulty')}: {review.difficulty}/5</span>
              {review.review_votes && (
                <span className="text-orange-600">{t('content.troll_votes')}: {review.review_votes.filter((v: any) => v.vote_type === 'rage_bait').length}</span>
              )}
            </div>
          </div>
          <button onClick={() => onDelete(review.id)} disabled={processingId === review.id} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 ml-4"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  );
}

function ReportsContent({ reviewReports, fileReports, onDeleteReview, processingId, t }: any) {
  if (reviewReports.length + fileReports.length === 0) return <p className="text-neutral-500 text-center py-4">{t('content.no_reports')}</p>;
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-neutral-700">{t('content.review_reports')} ({reviewReports.length})</h3>
      {reviewReports.map((report: any) => (
        <div key={report.id} className="p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm text-red-800 font-semibold mb-1">{t('content.reason')}: {report.reason || '-'}</p>
            <p className="text-sm text-neutral-700"><strong>{t('content.course')}:</strong> {report.reviews?.courses?.name}</p>
            <p className="text-sm text-neutral-600 mt-1 line-clamp-2"><strong>{t('content.comment')}:</strong> {report.reviews?.comment || '-'}</p>
          </div>
          <div className="flex flex-col space-y-2 ml-4">
            <Link href={`/course/${report.reviews?.course_id}`} target="_blank" className="p-2 bg-blue-100 text-blue-600 rounded-lg flex justify-center"><ExternalLink className="w-4 h-4" /></Link>
            <button onClick={() => onDeleteReview(report.review_id)} disabled={processingId === report.review_id} className="p-2 bg-red-100 text-red-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
      <h3 className="font-semibold text-neutral-700 mt-6">{t('content.file_reports')} ({fileReports.length})</h3>
      {fileReports.map((report: any) => (
        <div key={report.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-medium">{t('content.reason')}: {report.reason || '-'}</p>
          <p className="text-xs text-red-600 mt-1">{report.files?.file_name}</p>
        </div>
      ))}
    </div>
  );
}

function TrollReviewsContent({ reviews, onDelete, processingId, t }: any) {
  if (reviews.length === 0) return <p className="text-neutral-500 text-center py-4">{t('content.no_troll_reviews')}</p>;
  return (
    <div className="space-y-3">
      {reviews.map((review: any) => {
        const trollCount = review.review_votes?.filter((v: any) => v.vote_type === 'rage_bait').length || 0;
        return (
          <div key={review.id} className="p-4 border-2 border-orange-300 bg-orange-50 rounded-lg flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-bold text-orange-700">{t('content.troll_votes_count', { count: trollCount })}</span>
              </div>
              <p className="font-medium text-neutral-800">{review.courses?.name}</p>
              <p className="text-sm text-neutral-600 mt-1">{review.comment || '-'}</p>
            </div>
            <button onClick={() => onDelete(review.id)} disabled={processingId === review.id} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 ml-4"><Trash2 className="w-4 h-4" /></button>
          </div>
        );
      })}
    </div>
  );
}

function PendingTagsContent({ tags, onAction, processingId, t }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; type: 'positive' | 'negative' }>({ name: '', type: 'positive' });
  if (tags.length === 0) return <p className="text-neutral-500 text-center py-4">{t('content.no_tags')}</p>;

  return (
    <div className="space-y-3">
      {tags.map((tag: any) => (
        <div key={tag.id} className="p-4 border border-neutral-200 rounded-lg">
          {editingId === tag.id ? (
            <div className="flex flex-col space-y-3">
              <input type="text" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="input w-full" />
              <select value={editForm.type} onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as any }))} className="input w-full">
                <option value="positive">{t('content.positive_tag')}</option>
                <option value="negative">{t('content.negative_tag')}</option>
              </select>
              <div className="flex justify-end space-x-2">
                <button onClick={() => setEditingId(null)} className="px-3 py-1 text-sm bg-neutral-200 rounded">{t('content.cancel')}</button>
                <button onClick={() => { onAction(tag.id, 'approved', editForm); setEditingId(null); }} className="px-3 py-1 text-sm bg-green-600 text-white rounded">{t('content.save_and_approve')}</button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${tag.suggested_type === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tag.name}</span>
                <button onClick={() => { setEditingId(tag.id); setEditForm({ name: tag.name, type: tag.suggested_type }); }} className="text-xs text-blue-600 hover:underline ml-2">{t('content.edit')}</button>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onAction(tag.id, 'approved')} disabled={processingId === tag.id} className="p-2 bg-green-100 text-green-600 rounded-lg"><Check className="w-4 h-4" /></button>
                <button onClick={() => onAction(tag.id, 'rejected')} disabled={processingId === tag.id} className="p-2 bg-red-100 text-red-600 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TagManagementContent({ tags, onRefresh, processingId, setProcessingId, t }: any) {
  return <div className="p-4 text-center text-neutral-500">Etiket Yönetimi Yüklendi ({tags.length})</div>;
}

function CourseManagementContent({ courses, faculties, onRefresh, processingId, setProcessingId, t }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState({ code: '', name: '', faculty_id: '' });
  const [uploadCourseId, setUploadCourseId] = useState('');
  const [uploadType, setUploadType] = useState(FILE_TYPES.notes);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const filteredCourses = courses.filter((c: any) => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (!uploadCourseId && courses.length > 0) {
      setUploadCourseId(courses[0].id);
    }
  }, [uploadCourseId, courses]);

  const openAddModal = () => {
    setEditingCourse(null);
    setFormData({ code: '', name: '', faculty_id: faculties[0]?.id || '' });
    setIsModalOpen(true);
  };

  const openEditModal = (course: any) => {
    setEditingCourse(course);
    setFormData({ code: course.code, name: course.name, faculty_id: course.faculty_id });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingId('course-submit');
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, formData);
      } else {
        await createCourse(formData);
      }
      await onRefresh();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('content.delete_confirm'))) return;
    setProcessingId(id);
    try {
      await deleteCourse(id);
      await onRefresh();
    } catch (error) {
      // ignore
    } finally {
      setProcessingId(null);
    }
  };

  const handleAdminUpload = async () => {
    if (!uploadCourseId) {
      alert(t('content.select_course_first'));
      return;
    }
    if (!uploadFile) {
      alert(t('content.select_file_first'));
      return;
    }

    setProcessingId('admin-upload');
    try {
      await uploadFileAsAdmin(uploadCourseId, uploadFile, uploadType);
      setUploadFile(null);
      await onRefresh();
      alert(t('content.upload_success'));
    } catch (error: any) {
      alert(error.message || t('content.upload_failed'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border border-neutral-200 rounded-lg bg-neutral-50">
        <h3 className="font-semibold text-neutral-900 mb-3">{t('content.direct_upload_title')}</h3>
        <p className="text-sm text-neutral-600 mb-4">{t('content.direct_upload_desc')}</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={uploadCourseId}
            onChange={(e) => setUploadCourseId(e.target.value)}
            className="input w-full"
          >
            <option value="">{t('content.select_course')}</option>
            {courses.map((course: any) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>

          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value as any)}
            className="input w-full"
          >
            {Object.values(FILE_TYPES).map((type) => (
              <option key={type} value={type}>
                {t(`content.file_type_${type}`)}
              </option>
            ))}
          </select>

          <input
            type="file"
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="input w-full"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          />

          <button
            type="button"
            onClick={handleAdminUpload}
            disabled={processingId === 'admin-upload'}
            className="btn btn-primary"
          >
            {processingId === 'admin-upload' ? t('content.uploading') : t('content.upload_now')}
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input type="text" placeholder={t('content.search_course')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input w-full pl-9 bg-white" />
        </div>
        <button onClick={openAddModal} className="btn btn-primary whitespace-nowrap"><Plus className="w-4 h-4 mr-2" />{t('content.new_course')}</button>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium">{t('content.code')}</th>
                <th className="px-4 py-3 font-medium">{t('content.course_name')}</th>
                <th className="px-4 py-3 font-medium">{t('content.faculty')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('content.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredCourses.slice(0, 50).map((course: any) => (
                <tr key={course.id} className="hover:bg-neutral-50/50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{course.code}</td>
                  <td className="px-4 py-3 text-neutral-600">{course.name}</td>
                  <td className="px-4 py-3 text-neutral-500">{course.faculties?.name || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(course)} disabled={processingId === course.id} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(course.id)} disabled={processingId === course.id} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCourses.length === 0 && <div className="text-center py-8 text-neutral-500">{t('content.no_courses')}</div>}
          {filteredCourses.length > 50 && <div className="text-center py-4 text-xs text-neutral-400 border-t border-neutral-100">{t('content.showing_first_50')}</div>}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingCourse ? t('content.edit_course') : t('content.new_course')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm mb-1">{t('content.code')}</label><input type="text" required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="input w-full"/></div>
              <div><label className="block text-sm mb-1">{t('content.course_name')}</label><input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input w-full"/></div>
              <div>
                <label className="block text-sm mb-1">{t('content.faculty')}</label>
                <select required value={formData.faculty_id} onChange={e => setFormData({ ...formData, faculty_id: e.target.value })} className="input w-full">
                  <option value="" disabled>{t('content.select_faculty')}</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">{t('content.cancel')}</button>
                <button type="submit" disabled={processingId === 'course-submit'} className="btn btn-primary">{processingId === 'course-submit' ? t('content.saving') : t('content.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
