'use client';

import { useEffect, useState } from'react';
import { useRouter } from'next/navigation';
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
 rejectFile
} from'@/lib/utils';
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
 ExternalLink
} from'lucide-react';
import Link from'next/link';

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
 deleteTag as deleteTagAction
} from'@/app/actions';
import { Edit2, Plus } from'lucide-react';

// Admin password from environment variable
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||'kovan2026';

type TopicType ='pending_guides' |'all_reviews' |'reports' |'troll_reviews' |'pending_tags' |'pending_files' |'tag_management';

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
 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [password, setPassword] = useState('');
 const [passwordError, setPasswordError] = useState('');

 const [expandedTopic, setExpandedTopic] = useState<TopicType | null>(null);

 // Data states
 const [pendingFiles, setPendingFiles] = useState<any[]>([]);
 const [pendingGuides, setPendingGuides] = useState<any[]>([]);
 const [allReviews, setAllReviews] = useState<any[]>([]);
 const [reviewReports, setReviewReports] = useState<any[]>([]);
 const [fileReports, setFileReports] = useState<any[]>([]);
 const [trollReviews, setTrollReviews] = useState<any[]>([]);
 const [pendingTags, setPendingTags] = useState<any[]>([]);
 const [allTags, setAllTags] = useState<any[]>([]);

 const [loading, setLoading] = useState(false);
 const [processingId, setProcessingId] = useState<string | null>(null);

 // Check session storage for previous login
 useEffect(() => {
 const savedAuth = sessionStorage.getItem('admin_authenticated');
 if (savedAuth ==='true') {
 setIsAuthenticated(true);
 }
 }, []);

 // Load data when authenticated
 useEffect(() => {
 if (isAuthenticated) {
 loadAllData();
 }
 }, [isAuthenticated]);

 const handleLogin = (e: React.FormEvent) => {
 e.preventDefault();
 if (password === ADMIN_PASSWORD) {
 setIsAuthenticated(true);
 sessionStorage.setItem('admin_authenticated','true');
 setPasswordError('');
 } else {
 setPasswordError('Yanlış şifre!');
 }
 };

 const handleLogout = () => {
 setIsAuthenticated(false);
 sessionStorage.removeItem('admin_authenticated');
 setPassword('');
 };

 const loadAllData = async () => {
 setLoading(true);
 try {
 const [guides, reviews, revReports, fReports, trolls, tags, files, existingTags] = await Promise.all([
 getPendingSurvivalGuides('pending'),
 getAllReviews(),
 getReviewReports(),
 getFileReports(),
 getTrollReviews(3),
 getPendingTags('pending'),
 getPendingFiles(),
 fetchAllTags(),
 ]);
 setPendingGuides(guides);
 setAllReviews(reviews);
 setReviewReports(revReports);
 setFileReports(fReports);
 setTrollReviews(trolls);
 setPendingTags(tags);
 setPendingFiles(files);
 setAllTags(existingTags);
 } catch (error) {
 console.error('Error loading admin data:', error);
 } finally {
 setLoading(false);
 }
 };

 // Server Actions moved to top


 const handleGuideAction = async (guideId: string, action:'approved' |'rejected') => {
 setProcessingId(guideId);
 try {
 if (action ==='approved') {
 await approveSurvivalGuide(guideId);
 } else {
 await rejectSurvivalGuide(guideId);
 }
 // Optimistic update
 setPendingGuides(prev => prev.filter(g => g.id !== guideId));
 } catch (error) {
 console.error('Error updating survival guide:', error);
 alert('İşlem başarısız oldu.');
 } finally {
 setProcessingId(null);
 }
 };

 const handleTagAction = async (tagId: string, action:'approved' |'rejected', newData?: { name: string; type:'positive' |'negative' }) => {
 setProcessingId(tagId);
 try {
 if (action ==='approved') {
 await approvePendingTag(tagId, newData);
 } else {
 await rejectPendingTag(tagId);
 }
 setPendingTags(prev => prev.filter(t => t.id !== tagId));
 } catch (error: any) {
 console.error('Error updating tag:', error);
 alert(`Hata oluştu: ${error.message ||'Bilinmeyen hata'}`);
 } finally {
 setProcessingId(null);
 }
 };

 const handleFileAction = async (fileId: string, filePath: string, action:'approved' |'rejected') => {
 setProcessingId(fileId);
 try {
 if (action ==='approved') {
 await approveFileAction(fileId);
 } else {
 await rejectFileAction(fileId, filePath);
 }
 setPendingFiles(prev => prev.filter(f => f.id !== fileId));
 } catch (error) {
 console.error('Error updating file:', error);
 alert('Dosya işlemi başarısız.');
 } finally {
 setProcessingId(null);
 }
 };

 const handleDeleteReview = async (reviewId: string) => {
 if (!confirm('Bu değerlendirmeyi silmek istediğinizden emin misiniz?')) return;

 setProcessingId(reviewId);
 try {
 await deleteReviewAction(reviewId);
 setAllReviews(prev => prev.filter(r => r.id !== reviewId));
 setTrollReviews(prev => prev.filter(r => r.id !== reviewId));
 } catch (error) {
 console.error('Error deleting review:', error);
 alert('Silme işlemi başarısız.');
 } finally {
 setProcessingId(null);
 }
 };

 // Define topics
 const topics: TopicData[] = [
 {
 id:'pending_files',
 title:'Bekleyen Dosyalar',
 icon: <FileText className="w-6 h-6"/>,
 description:'Onay bekleyen ders dosyaları',
 count: pendingFiles.length,
 color:'teal'
 },
 {
 id:'pending_guides',
 title:'Bekleyen Survival Guide\'lar',
 icon: <Clock className="w-6 h-6"/>,
 description:'Onay bekleyen survival guide içerikleri',
 count: pendingGuides.length,
 color:'amber'
 },
 {
 id:'all_reviews',
 title:'Tüm Değerlendirmeler',
 icon: <MessageSquare className="w-6 h-6"/>,
 description:'Sistemdeki tüm değerlendirmeler',
 count: allReviews.length,
 color:'blue'
 },
 {
 id:'reports',
 title:'Raporlar',
 icon: <Flag className="w-6 h-6"/>,
 description:'Kullanıcılar tarafından raporlanan içerikler',
 count: reviewReports.length + fileReports.length,
 color:'red'
 },
 {
 id:'troll_reviews',
 title:'Troll Değerlendirmeler',
 icon: <AlertTriangle className="w-6 h-6"/>,
 description:'3+ "Troll"oyu alan değerlendirmeler',
 count: trollReviews.length,
 color:'orange'
 },
 {
 id:'pending_tags',
 title:'Bekleyen Etiketler',
 icon: <Tag className="w-6 h-6"/>,
 description:'Onay bekleyen kullanıcı etiketleri',
 count: pendingTags.length,
 color:'purple'
 },
 {
 id:'tag_management',
 title:'Etiket Yönetimi',
 icon: <Edit2 className="w-6 h-6"/>,
 description:'Tüm etiketleri ekle, düzenle, sil',
 count: allTags.length,
 color:'blue'
 },
 ];

 // Login Screen
 if (!isAuthenticated) {
 return (
 <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
 <div className="card max-w-md w-full p-8 bg-white/95 backdrop-blur shadow-2xl">
 <div className="text-center mb-8">
 <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
 <Shield className="w-8 h-8 text-primary-600"/>
 </div>
 <h1 className="text-2xl font-bold text-neutral-900">Admin Paneli</h1>
 <p className="text-neutral-600 mt-2">Yönetici şifrenizi girin</p>
 </div>

 <form onSubmit={handleLogin} className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-neutral-700 mb-2">
 <Lock className="w-4 h-4 inline mr-2"/>
 Şifre
 </label>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="input w-full"
 placeholder="••••••••"
 autoFocus
 />
 {passwordError && (
 <p className="text-red-500 text-sm mt-2">{passwordError}</p>
 )}
 </div>

 <button type="submit"className="btn btn-primary w-full">
 Giriş Yap
 </button>
 </form>

 <div className="mt-6 text-center">
 <button
 onClick={() => router.push('/')}
 className="text-sm text-neutral-500 hover:text-primary-600 flex items-center justify-center mx-auto"
 >
 <ArrowLeft className="w-4 h-4 mr-1"/>
 Ana Sayfaya Dön
 </button>
 </div>
 </div>
 </div>
 );
 }

 // Admin Dashboard
 return (
 <div className="min-h-screen bg-neutral-50 text-neutral-900 ">
 {/* Header */}
 <div className="bg-white border-b border-neutral-200 sticky top-0 z-50">
 <div className="container mx-auto px-4 h-16 flex items-center justify-between">
 <div className="flex items-center space-x-4">
 <button
 onClick={() => router.push('/')}
 className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
 title="Ana Sayfa"
 >
 <ArrowLeft className="w-5 h-5 text-neutral-600"/>
 </button>
 <div className="flex items-center space-x-2">
 <Shield className="w-6 h-6 text-primary-600"/>
 <h1 className="text-xl font-bold text-neutral-900">Admin Paneli</h1>
 </div>
 </div>

 <button
 onClick={handleLogout}
 className="btn btn-ghost text-sm text-red-600 hover:bg-red-50"
 >
 Çıkış
 </button>
 </div>
 </div>

 {/* Main Content */}
 <div className="container mx-auto px-4 py-8">
 {loading ? (
 <div className="flex items-center justify-center py-12">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
 <span className="ml-3 text-neutral-600">Yükleniyor...</span>
 </div>
 ) : (
 <div className="space-y-4">
 {topics.map((topic) => (
 <div key={topic.id} className="card overflow-hidden">
 {/* Topic Header (Clickable) */}
 <button
 onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
 className={`w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors ${expandedTopic === topic.id ?'bg-neutral-50' :''
 }`}
 >
 <div className="flex items-center space-x-4">
 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${topic.color ==='amber' ?'bg-amber-100 text-amber-600' :
 topic.color ==='blue' ?'bg-blue-100 text-blue-600' :
 topic.color ==='red' ?'bg-red-100 text-red-600' :
 topic.color ==='orange' ?'bg-orange-100 text-orange-600' :
 topic.color ==='teal' ?'bg-teal-100 text-teal-600' :
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
 <span className={`px-3 py-1 rounded-full text-sm font-bold ${topic.count === 0 ?'bg-neutral-100 text-neutral-500' :
 topic.color ==='amber' ?'bg-amber-100 text-amber-700' :
 topic.color ==='blue' ?'bg-blue-100 text-blue-700' :
 topic.color ==='red' ?'bg-red-100 text-red-700' :
 topic.color ==='orange' ?'bg-orange-100 text-orange-700' :
 topic.color ==='teal' ?'bg-teal-100 text-teal-700' :
'bg-purple-100 text-purple-700'
 }`}>
 {topic.count}
 </span>
 {expandedTopic === topic.id ? (
 <ChevronDown className="w-5 h-5 text-neutral-400"/>
 ) : (
 <ChevronRight className="w-5 h-5 text-neutral-400"/>
 )}
 </div>
 </button>

 {/* Topic Content */}
 {expandedTopic === topic.id && (
 <div className="border-t border-neutral-100 p-6 bg-white ">
 {topic.id ==='pending_files' && (
 <PendingFilesContent
 files={pendingFiles}
 onAction={handleFileAction}
 processingId={processingId}
 />
 )}
 {topic.id ==='pending_guides' && (
 <PendingGuidesContent
 guides={pendingGuides}
 onAction={handleGuideAction}
 processingId={processingId}
 />
 )}
 {topic.id ==='all_reviews' && (
 <AllReviewsContent
 reviews={allReviews}
 onDelete={handleDeleteReview}
 processingId={processingId}
 />
 )}
 {topic.id ==='reports' && (
 <ReportsContent
 reviewReports={reviewReports}
 fileReports={fileReports}
 onDeleteReview={handleDeleteReview}
 processingId={processingId}
 />
 )}
 {topic.id ==='troll_reviews' && (
 <TrollReviewsContent
 reviews={trollReviews}
 onDelete={handleDeleteReview}
 processingId={processingId}
 />
 )}
 {topic.id ==='pending_tags' && (
 <PendingTagsContent
 tags={pendingTags}
 onAction={handleTagAction}
 processingId={processingId}
 />
 )}
 {topic.id ==='tag_management' && (
 <TagManagementContent
 tags={allTags}
 onRefresh={async () => {
 const updated = await fetchAllTags();
 setAllTags(updated);
 }}
 processingId={processingId}
 setProcessingId={setProcessingId}
 />
 )}
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

// Sub-components for topic content

function PendingFilesContent({ files, onAction, processingId }: any) {
 if (files.length === 0) {
 return <p className="text-neutral-500 text-center py-4">Bekleyen dosya yok.</p>;
 }
 return (
 <div className="space-y-4">
 {files.map((file: any) => (
 <div key={file.id} className="p-4 border border-neutral-200 rounded-lg">
 <div className="flex justify-between items-start">
 <div className="flex-1">
 <div className="flex items-center space-x-2 mb-1">
 <span className="uppercase text-xs font-bold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
 {file.type}
 </span>
 <p className="font-medium text-neutral-800">
 {file.file_name}
 </p>
 </div>
 <p className="text-sm text-neutral-600 mb-1">
 {file.courses?.name} ({file.courses?.code})
 </p>
 <div className="flex items-center space-x-4 text-xs text-neutral-400 mt-2">
 <span>{new Date(file.created_at).toLocaleDateString('tr-TR')}</span>
 <a
 href={file.file_url}
 target="_blank"
 rel="noopener noreferrer"
 className="text-primary-600 hover:underline flex items-center"
 >
 <ExternalLink className="w-3 h-3 mr-1"/>
 Dosyayı Görüntüle
 </a>
 </div>
 </div>
 <div className="flex space-x-2 ml-4">
 <button
 onClick={() => onAction(file.id, file.file_path,'approved')}
 disabled={processingId === file.id}
 className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
 >
 <Check className="w-4 h-4"/>
 </button>
 <button
 onClick={() => onAction(file.id, file.file_path,'rejected')}
 disabled={processingId === file.id}
 className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 );
}

function PendingGuidesContent({ guides, onAction, processingId }: any) {
 if (guides.length === 0) {
 return <p className="text-neutral-500 text-center py-4">Bekleyen guide yok.</p>;
 }
 return (
 <div className="space-y-4">
 {guides.map((guide: any) => (
 <div key={guide.id} className="p-4 border border-neutral-200 rounded-lg">
 <div className="flex justify-between items-start">
 <div className="flex-1">
 <p className="font-medium text-neutral-800 mb-1">
 {guide.courses?.name} ({guide.courses?.code})
 </p>
 <p className="text-neutral-600 italic">"{guide.survival_guide}"</p>
 <p className="text-xs text-neutral-400 mt-2">
 {new Date(guide.created_at).toLocaleDateString('tr-TR')}
 </p>
 </div>
 <div className="flex space-x-2 ml-4">
 <button
 onClick={() => onAction(guide.id,'approved')}
 disabled={processingId === guide.id}
 className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
 >
 <Check className="w-4 h-4"/>
 </button>
 <button
 onClick={() => onAction(guide.id,'rejected')}
 disabled={processingId === guide.id}
 className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 );
}

function AllReviewsContent({ reviews, onDelete, processingId }: any) {
 if (reviews.length === 0) {
 return <p className="text-neutral-500 text-center py-4">Değerlendirme yok.</p>;
 }
 return (
 <div className="space-y-3 max-h-[500px] overflow-y-auto">
 {reviews.slice(0, 50).map((review: any) => (
 <div key={review.id} className="p-4 border border-neutral-200 rounded-lg flex justify-between items-start">
 <div className="flex-1">
 <p className="font-medium text-neutral-800">
 {review.courses?.name} ({review.courses?.code})
 </p>
 <p className="text-sm text-neutral-600 mt-1 line-clamp-2">{review.comment ||'Yorum yok'}</p>
 <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-400">
 <span>{new Date(review.created_at).toLocaleDateString('tr-TR')}</span>
 <span>Zorluk: {review.difficulty}/5</span>
 {review.review_votes && (
 <span className="text-orange-600">
 Troll: {review.review_votes.filter((v: any) => v.vote_type ==='rage_bait').length}
 </span>
 )}
 </div>
 </div>
 <button
 onClick={() => onDelete(review.id)}
 disabled={processingId === review.id}
 className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors ml-4"
 title="Sil"
 >
 <Trash2 className="w-4 h-4"/>
 </button>
 </div>
 ))}
 {reviews.length > 50 && (
 <p className="text-neutral-500 text-center text-sm">+{reviews.length - 50} daha fazla</p>
 )}
 </div>
 );
}

function ReportsContent({ reviewReports, fileReports, onDeleteReview, processingId }: any) {
 const total = reviewReports.length + fileReports.length;
 if (total === 0) {
 return <p className="text-neutral-500 text-center py-4">Rapor yok.</p>;
 }
 return (
 <div className="space-y-4">
 <h3 className="font-semibold text-neutral-700">Değerlendirme Raporları ({reviewReports.length})</h3>
 {reviewReports.length === 0 ? (
 <p className="text-neutral-400 text-sm">Değerlendirme raporu yok.</p>
 ) : (
 reviewReports.map((report: any) => (
 <div key={report.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
 <div className="flex justify-between items-start">
 <div className="flex-1">
 <p className="text-sm text-red-800 font-semibold mb-1">
 Sebep: {report.reason ||'Belirtilmedi'}
 </p>
 <p className="text-sm text-neutral-700">
 <strong>Ders:</strong> {report.reviews?.courses?.name} ({report.reviews?.courses?.code})
 </p>
 <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
 <strong>Yorum:</strong> {report.reviews?.comment ||'Yorum yok'}
 </p>
 <p className="text-xs text-neutral-400 mt-2">
 {new Date(report.created_at).toLocaleDateString('tr-TR')}
 </p>
 </div>
 <div className="flex flex-col space-y-2 ml-4">
 <Link
 href={`/course/${report.reviews?.course_id}`}
 target="_blank"
 className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
 title="Sayfaya Git"
 >
 <ExternalLink className="w-4 h-4"/>
 </Link>
 <button
 onClick={() => onDeleteReview(report.review_id)}
 disabled={processingId === report.review_id}
 className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
 title="Değerlendirmeyi Sil"
 >
 <Trash2 className="w-4 h-4"/>
 </button>
 </div>
 </div>
 </div>
 ))
 )}

 <h3 className="font-semibold text-neutral-700 mt-6">Dosya Raporları ({fileReports.length})</h3>
 {fileReports.length === 0 ? (
 <p className="text-neutral-400 text-sm">Dosya raporu yok.</p>
 ) : (
 fileReports.map((report: any) => (
 <div key={report.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
 <p className="text-sm text-red-800 font-medium">Sebep: {report.reason ||'Belirtilmedi'}</p>
 <p className="text-xs text-red-600 mt-1">
 {report.files?.file_name} - {new Date(report.created_at).toLocaleDateString('tr-TR')}
 </p>
 </div>
 ))
 )}
 </div>
 );
}

function TrollReviewsContent({ reviews, onDelete, processingId }: any) {
 if (reviews.length === 0) {
 return <p className="text-neutral-500 text-center py-4">🎉 Troll değerlendirme yok!</p>;
 }
 return (
 <div className="space-y-3">
 {reviews.map((review: any) => {
 const trollCount = review.review_votes?.filter((v: any) => v.vote_type ==='rage_bait').length || 0;
 return (
 <div key={review.id} className="p-4 border-2 border-orange-300 bg-orange-50 rounded-lg flex justify-between items-start">
 <div className="flex-1">
 <div className="flex items-center space-x-2 mb-2">
 <AlertTriangle className="w-4 h-4 text-orange-600"/>
 <span className="text-sm font-bold text-orange-700">{trollCount} Troll Oyu</span>
 </div>
 <p className="font-medium text-neutral-800">
 {review.courses?.name} ({review.courses?.code})
 </p>
 <p className="text-sm text-neutral-600 mt-1">{review.comment ||'Yorum yok'}</p>
 </div>
 <button
 onClick={() => onDelete(review.id)}
 disabled={processingId === review.id}
 className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ml-4"
 title="Sil"
 >
 <Trash2 className="w-4 h-4"/>
 </button>
 </div>
 );
 })}
 </div>
 );
}


interface PendingTagsContentProps {
 tags: any[];
 onAction: (tagId: string, action:'approved' |'rejected', newData?: { name: string; type:'positive' |'negative' }) => void;
 processingId: string | null;
}

function PendingTagsContent({ tags, onAction, processingId }: PendingTagsContentProps) {
 const [editingId, setEditingId] = useState<string | null>(null);
 const [editForm, setEditForm] = useState<{ name: string; type:'positive' |'negative' }>({ name:'', type:'positive' });

 if (tags.length === 0) {
 return <p className="text-neutral-500 text-center py-4">Bekleyen etiket yok.</p>;
 }

 const startEditing = (tag: any) => {
 setEditingId(tag.id);
 setEditForm({ name: tag.name, type: tag.suggested_type });
 };

 const cancelEditing = () => {
 setEditingId(null);
 };

 const handleSaveAndApprove = (tagId: string) => {
 onAction(tagId,'approved', editForm);
 setEditingId(null);
 };

 return (
 <div className="space-y-3">
 {tags.map((tag: any) => (
 <div key={tag.id} className="p-4 border border-neutral-200 rounded-lg">
 {editingId === tag.id ? (
 <div className="flex flex-col space-y-3">
 <input
 type="text"
 value={editForm.name}
 onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
 className="input w-full"
 placeholder="Etiket adı"
 />
 <select
 value={editForm.type}
 onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value as any }))}
 className="input w-full"
 >
 <option value="positive">Pozitif</option>
 <option value="negative">Negatif</option>
 </select>
 <div className="flex justify-end space-x-2">
 <button
 onClick={cancelEditing}
 className="px-3 py-1 text-sm text-neutral-600 hover:bg-neutral-100 rounded"
 >
 İptal
 </button>
 <button
 onClick={() => handleSaveAndApprove(tag.id)}
 className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
 >
 Kaydet ve Onayla
 </button>
 </div>
 </div>
 ) : (
 <div className="flex justify-between items-center">
 <div>
 <div className="flex items-center space-x-2">
 <span className={`px-3 py-1 rounded-full text-sm font-medium ${tag.suggested_type ==='positive' ?'bg-green-100 text-green-700' :'bg-red-100 text-red-700'
 }`}>
 {tag.name}
 </span>
 <button
 onClick={() => startEditing(tag)}
 className="text-xs text-blue-600 hover:underline"
 >
 Düzenle
 </button>
 </div>
 <p className="text-xs text-neutral-400 mt-2">
 {tag.suggested_type ==='positive' ?'Pozitif' :'Negatif'} etiket
 {tag.courses &&` • ${tag.courses.name}`}
 </p>
 </div>
 <div className="flex space-x-2">
 <button
 onClick={() => onAction(tag.id,'approved')}
 disabled={processingId === tag.id}
 className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
 title="Onayla"
 >
 <Check className="w-4 h-4"/>
 </button>
 <button
 onClick={() => onAction(tag.id,'rejected')}
 disabled={processingId === tag.id}
 className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
 title="Reddet"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 );
}

// Tag Management CRUD Component
function TagManagementContent({ tags, onRefresh, processingId, setProcessingId }: {
 tags: any[];
 onRefresh: () => Promise<void>;
 processingId: string | null;
 setProcessingId: (id: string | null) => void;
}) {
 const [editingTag, setEditingTag] = useState<string | null>(null);
 const [editName, setEditName] = useState('');
 const [editType, setEditType] = useState<'positive' |'negative'>('positive');
 const [newName, setNewName] = useState('');
 const [newType, setNewType] = useState<'positive' |'negative'>('positive');
 const [showAddForm, setShowAddForm] = useState(false);
 const [error, setError] = useState('');

 const handleCreate = async () => {
 if (!newName.trim()) return;
 setError('');
 setProcessingId('creating');
 try {
 await createTagAction(newName.trim(), newType);
 setNewName('');
 setNewType('positive');
 setShowAddForm(false);
 await onRefresh();
 } catch (err: any) {
 setError(err.message ||'Etiket oluşturulamadı');
 } finally {
 setProcessingId(null);
 }
 };

 const handleUpdate = async (tagId: string) => {
 if (!editName.trim()) return;
 setError('');
 setProcessingId(tagId);
 try {
 await updateTagAction(tagId, editName.trim(), editType);
 setEditingTag(null);
 await onRefresh();
 } catch (err: any) {
 setError(err.message ||'Etiket güncellenemedi');
 } finally {
 setProcessingId(null);
 }
 };

 const handleDelete = async (tagId: string) => {
 if (!confirm('Bu etiketi silmek istediğinizden emin misiniz? İlişkili tüm review bağlantıları da silinecektir.')) return;
 setError('');
 setProcessingId(tagId);
 try {
 await deleteTagAction(tagId);
 await onRefresh();
 } catch (err: any) {
 setError(err.message ||'Etiket silinemedi');
 } finally {
 setProcessingId(null);
 }
 };

 const startEditing = (tag: any) => {
 setEditingTag(tag.id);
 setEditName(tag.name);
 setEditType(tag.type);
 };

 return (
 <div className="space-y-4">
 {/* Add Button */}
 <div className="flex items-center justify-between">
 <p className="text-sm text-neutral-500">{tags.length} etiket mevcut</p>
 <button
 onClick={() => setShowAddForm(!showAddForm)}
 className="flex items-center space-x-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
 >
 <Plus className="w-4 h-4"/>
 <span>Yeni Etiket</span>
 </button>
 </div>

 {/* Error */}
 {error && (
 <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm text-red-700 font-medium">
 {error}
 </div>
 )}

 {/* Add Form */}
 {showAddForm && (
 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
 <h4 className="text-sm font-semibold text-blue-800">Yeni Etiket Ekle</h4>
 <div className="flex flex-col sm:flex-row gap-3">
 <input
 type="text"
 value={newName}
 onChange={(e) => setNewName(e.target.value)}
 placeholder="Etiket adı..."
 className="input flex-1 text-sm"
 autoFocus
 />
 <select
 value={newType}
 onChange={(e) => setNewType(e.target.value as'positive' |'negative')}
 className="input text-sm w-32"
 >
 <option value="positive">Pozitif</option>
 <option value="negative">Negatif</option>
 </select>
 <div className="flex space-x-2">
 <button
 onClick={handleCreate}
 disabled={!newName.trim() || processingId ==='creating'}
 className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50"
 >
 {processingId ==='creating' ?'...' :'Ekle'}
 </button>
 <button
 onClick={() => { setShowAddForm(false); setNewName(''); }}
 className="px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 text-sm"
 >
 İptal
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Tag List */}
 <div className="space-y-2">
 {tags.map(tag => (
 <div key={tag.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors">
 {editingTag === tag.id ? (
 /* Edit Mode */
 <div className="flex flex-col sm:flex-row gap-2 flex-1 mr-2">
 <input
 type="text"
 value={editName}
 onChange={(e) => setEditName(e.target.value)}
 className="input text-sm flex-1"
 autoFocus
 />
 <select
 value={editType}
 onChange={(e) => setEditType(e.target.value as'positive' |'negative')}
 className="input text-sm w-32"
 >
 <option value="positive">Pozitif</option>
 <option value="negative">Negatif</option>
 </select>
 <div className="flex space-x-1">
 <button
 onClick={() => handleUpdate(tag.id)}
 disabled={processingId === tag.id}
 className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
 title="Kaydet"
 >
 <Check className="w-4 h-4"/>
 </button>
 <button
 onClick={() => setEditingTag(null)}
 className="p-2 bg-neutral-100 text-neutral-600 rounded-lg hover:bg-neutral-200"
 title="İptal"
 >
 <X className="w-4 h-4"/>
 </button>
 </div>
 </div>
 ) : (
 /* View Mode */
 <>
 <div className="flex items-center space-x-3">
 <span className={`px-2 py-1 rounded text-xs font-bold ${tag.type ==='positive'
 ?'bg-green-100 text-green-700'
 :'bg-red-100 text-red-700'
 }`}>
 {tag.type ==='positive' ?'👍' :'👎'}
 </span>
 <span className="text-sm font-medium text-neutral-800">{tag.name}</span>
 {tag.name_tr && (
 <span className="text-xs text-neutral-500">({tag.name_tr})</span>
 )}
 </div>
 <div className="flex space-x-1">
 <button
 onClick={() => startEditing(tag)}
 className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
 title="Düzenle"
 >
 <Edit2 className="w-4 h-4"/>
 </button>
 <button
 onClick={() => handleDelete(tag.id)}
 disabled={processingId === tag.id}
 className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
 title="Sil"
 >
 <Trash2 className="w-4 h-4"/>
 </button>
 </div>
 </>
 )}
 </div>
 ))}

 {tags.length === 0 && (
 <div className="text-center py-8 text-neutral-500">
 <Tag className="w-8 h-8 mx-auto mb-2 text-neutral-400"/>
 <p>Henüz etiket yok</p>
 </div>
 )}
 </div>
 </div>
 );
}
