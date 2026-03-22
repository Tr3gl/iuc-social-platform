import { Shield, AlertTriangle, Scale } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        
        <div className="mb-8 text-center">
          <Scale className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Community Guidelines & Legal Notice</h1>
          <p className="text-lg text-neutral-600">
            Please read these rules carefully before contributing to the platform.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Disclaimer */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-semibold">Disclaimer</h2>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              This platform is an independent, student-run educational resource. It is <strong>not affiliated with, endorsed by, or connected to any official university administration</strong>. Any views or opinions expressed on this platform belong solely to the original authors and do not reflect the views of the university.
            </p>
          </div>

          {/* Strict Community Guidelines */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-semibold">Strict Community Guidelines</h2>
            </div>
            
            <div className="space-y-6">
              
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <h3 className="text-lg font-bold text-red-900 mb-2">Zero Tolerance for Politics</h3>
                <p className="text-red-800">
                  This is an academic hub. Any political discussions, calls for rallies, or non-academic activism will be immediately deleted.
                </p>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <h3 className="text-lg font-bold text-orange-900 mb-2">No Personal Insults (Hakaret)</h3>
                <p className="text-orange-800">
                  Reviews must strictly evaluate teaching methodology and course structure. Personal attacks, defamation, or discussing a professor's private life will result in a permanent ban and potential legal repercussions under KVKK and defamation laws.
                </p>
              </div>

              <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
                <h3 className="text-lg font-bold text-primary-900 mb-2">Copyright Policy</h3>
                <p className="text-primary-800">
                  Do not upload raw, copyrighted exam papers. Upload only study guides, lab templates, and AI-modified practice exams. Content flagged for copyright infringement will be promptly removed.
                </p>
              </div>
              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
