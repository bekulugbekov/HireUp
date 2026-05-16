import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJob } from '../store/slices/jobsSlice';
import { applicationService } from '../services/applicationService';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

export default function JobDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { job, loading } = useSelector((s) => s.jobs);
  const { isAuthenticated, isUser } = useAuth();
  const [applying, setApplying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [resume, setResume] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');

  useEffect(() => {
    dispatch(fetchJob(id));
  }, [dispatch, id]);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    setApplying(true);
    try {
      const res = await applicationService.apply(id, { resume, coverLetter });
      toast.success(res.data.message || 'Ariza muvaffaqiyatli yuborildi');
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Spinner />;
  if (!job) return <div className="text-center py-16 text-gray-500">{t('jobs.notFound')}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="text-primary-600 dark:text-primary-400 flex items-center gap-1 mb-6 hover:underline">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('common.back')}
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{job.company}</p>
          </div>
          {isUser && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary self-start shrink-0"
            >
              {t('jobs.applyNow')}
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <span className="badge-blue">{job.category}</span>
          <span className="badge-gray">{t(`jobType.${job.type}`)}</span>
          <span className="badge-gray">{t(`experience.${job.experience}`)}</span>
          <span className="badge-gray">📍 {job.location}</span>
          {job.salary?.min > 0 && (
            <span className="badge-green">
              💰 {job.salary.min.toLocaleString()} – {job.salary.max.toLocaleString()} {job.salary.currency}
            </span>
          )}
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('jobs.filter.title')} haqida</h3>
          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{job.description}</p>
        </div>

        {job.requirements?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Talablar</h3>
            <ul className="space-y-2">
              {job.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-primary-600 mt-1">✓</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          {t('jobs.postedBy')}: <span className="font-medium text-gray-700 dark:text-gray-300">{job.createdBy?.fullName}</span>
          <span className="mx-2">•</span>
          {t('jobs.postedAt')}: {new Date(job.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Apply Form */}
      {showForm && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ariza berish</h2>
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Resume (PDF/DOC)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setResume(e.target.files[0])}
                className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cover Letter (ixtiyoriy)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                className="input-field"
                placeholder="O'zingiz haqingizda qisqacha..."
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={applying} className="btn-primary disabled:opacity-60">
                {applying ? t('common.loading') : t('jobs.applyNow')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
