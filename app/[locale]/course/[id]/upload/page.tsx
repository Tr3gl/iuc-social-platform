'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/AuthProvider';
import { getCourseById, uploadFile } from '@/lib/utils';
import { FILE_TYPES, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/constants';
import { ArrowLeft, Upload, AlertCircle, FileText } from 'lucide-react';

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('Upload');
  const tConstants = useTranslations('Constants');
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [fileType, setFileType] = useState<'exam' | 'notes' | 'other'>('exam');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    } else if (user) {
      loadCourse();
    }
  }, [user, authLoading, courseId]);

  const loadCourse = async () => {
    try {
      const courseData = await getCourseById(courseId);
      setCourse(courseData);
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess(false);

    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(t('error_size', { size: MAX_FILE_SIZE / 1024 / 1024 }));
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError(t('error_type'));
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError(t('error_no_file'));
      return;
    }

    setUploading(true);
    setError('');

    try {
      await uploadFile(courseId, selectedFile, fileType);
      setSuccess(true);
      setSelectedFile(null);

      // Reset form
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/course/${courseId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || t('Common.error'));
    } finally {
      setUploading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-neutral-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600">{t('course_not_found')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={() => router.push(`/course/${courseId}`)}
          className="flex items-center space-x-2 text-neutral-600 hover:text-primary-600 mb-6 px-3 py-2 bg-neutral-100 hover:bg-primary-50 rounded-lg transition-colors text-base font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t('back_to_course')}</span>
        </button>

        <div className="card p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {t('title')}
              </h1>
              <p className="text-neutral-600">
                {course.name} - {course.code}
              </p>
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                {t('success_message')}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>{t('warning_title')}:</strong> {t('warning_text')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Type Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                {t('file_type_label')}
              </label>
              <div className="space-y-2">
                {(Object.entries(FILE_TYPES) as [keyof typeof FILE_TYPES, string][]).map(
                  ([key]) => (
                    <label key={key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="fileType"
                        value={key}
                        checked={fileType === key}
                        onChange={(e) => setFileType(e.target.value as typeof fileType)}
                        className="w-4 h-4 text-primary-600"
                      />
                      <span className="text-neutral-700">{tConstants(`file_types.${key}`)}</span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label htmlFor="file-input" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('select_file_label')}
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-lg hover:border-primary-400 transition-colors">
                <div className="space-y-1 text-center">
                  <FileText className="mx-auto h-12 w-12 text-neutral-400" />
                  <div className="flex text-sm text-neutral-600">
                    <label
                      htmlFor="file-input"
                      className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500"
                    >
                      <span>{t('upload_file_placeholder')}</span>
                      <input
                        id="file-input"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                    </label>
                    <p className="pl-1">{t('drag_drop_text')}</p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {t('file_constraints', { size: MAX_FILE_SIZE / 1024 / 1024 })}
                  </p>
                </div>
              </div>

              {selectedFile && (
                <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-neutral-600" />
                    <span className="text-sm text-neutral-900">{selectedFile.name}</span>
                    <span className="text-xs text-neutral-500">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Guidelines */}
            <div className="bg-neutral-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-neutral-900 mb-2">
                {t('rules_title')}
              </h3>
              <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
                <li>{t('rule_1')}</li>
                <li>{t('rule_2')}</li>
                <li>{t('rule_3')}</li>
                <li>{t('rule_4')}</li>
              </ul>
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? t('uploading_button') : t('submit_button')}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/course/${courseId}`)}
                className="btn btn-secondary"
              >
                {t('cancel_button')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
