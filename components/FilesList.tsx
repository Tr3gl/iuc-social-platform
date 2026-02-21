'use client';

import { useState } from'react';
import { useAuth } from'./AuthProvider';
import { useTranslations, useLocale } from'next-intl';
import { deleteFile, reportFile } from'@/lib/utils';
import { FILE_TYPES } from'@/lib/constants';
import { FileText, Download, Trash2, Flag } from'lucide-react';
import { File } from'@/lib/types'; // Import shared type

interface Props {
 files: File[];
 courseId: string;
 onUpdate: () => void;
}

export default function FilesList({ files, courseId, onUpdate }: Props) {
 const { user } = useAuth();
 const t = useTranslations('Files');
 const tConstants = useTranslations('Constants');
 const locale = useLocale();
 const [deleting, setDeleting] = useState<string | null>(null);
 const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

 const handleDelete = (fileId: string, filePath: string) => {
 if (!confirm(t('confirm_delete'))) {
 return;
 }

 // Optimistically hide the file
 setDeletedIds(prev => {
 const newSet = new Set(prev);
 newSet.add(fileId);
 return newSet;
 });

 // Fire and forget (sort of) - we handle errors by reverting
 deleteFile(fileId, filePath)
 .then(() => {
 onUpdate();
 onUpdate(); // Calling twice as in original code (maybe to ensure cache flush? Keeping for safety)
 })
 .catch((error) => {
 alert(t('error_delete'));
 // Revert optimistic delete if it fails
 setDeletedIds(prev => {
 const newSet = new Set(prev);
 newSet.delete(fileId);
 return newSet;
 });
 });
 };

 const handleReport = (fileId: string) => {
 if (!user) {
 alert(t('login_required_report'));
 return;
 }

 const reason = prompt(t('report_reason_prompt'));
 if (reason === null) return;

 // Optimistic success
 alert(t('report_success'));

 // Send in background
 reportFile(fileId, reason).catch((error: any) => {
 // access error.message safely
 const msg = error?.message || t('error_report');
 // Ideally show a toast here, but we can't alert again easily as it disturbs flow.
 console.error('Report error:', msg);
 });
 };

 if (files.length === 0) {
 return (
 <div className="card p-8 text-center">
 <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4"/>
 <p className="text-neutral-600">{t('no_files')}</p>
 </div>
 );
 }

 return (
 <div className="space-y-3">
 {files.filter(f => !deletedIds.has(f.id)).map((file) => (
 <div key={file.id} className="card p-4 border border-neutral-200 bg-white ">
 <div className="flex items-center justify-between">
 <div className="flex items-center space-x-3 flex-1">
 <FileText className="w-5 h-5 text-neutral-500 flex-shrink-0"/>
 <div className="flex-1 min-w-0">
 <div className="flex items-center space-x-2 mb-1">
 <span className="text-sm font-medium text-neutral-900 truncate">
 {file.file_name}
 </span>
 <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded border border-neutral-300">
 {tConstants(`file_types.${file.type}`)}
 </span>
 </div>
 <div className="text-xs text-neutral-500">
 {new Date(file.created_at).toLocaleDateString(locale)}
 </div>
 </div>
 </div>

 <div className="flex items-center space-x-2 ml-4">
 <a
 href={file.file_url}
 target="_blank"
 rel="noopener noreferrer"
 className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
 title={t('download')}
 >
 <Download className="w-4 h-4"/>
 </a>

 {user && user.id === file.user_id && (
 <button
 onClick={() => handleDelete(file.id, file.file_path)}
 disabled={deleting === file.id}
 className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
 title={t('delete')}
 >
 <Trash2 className="w-4 h-4"/>
 </button>
 )}

 {user && user.id !== file.user_id && (
 <button
 onClick={() => handleReport(file.id)}
 className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
 title={t('report')}
 >
 <Flag className="w-4 h-4"/>
 </button>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 );
}
