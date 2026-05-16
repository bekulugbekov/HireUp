import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  IT: '💻', Marketing: '📢', Design: '🎨', Finance: '💰',
  Education: '📚', Healthcare: '🏥', Engineering: '⚙️', Sales: '🤝', Other: '💼',
};

export default function JobCard({ job, saved = false, onSaveToggle }) {
  const { t } = useTranslation();
  const { isAuthenticated, isUser } = useAuth();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Iltimos, avval kiring'); return; }
    try {
      await userService.saveJob(job._id);
      onSaveToggle?.(job._id);
    } catch {
      toast.error(t('common.error'));
    }
  };

  return (
    <Link to={`/jobs/${job._id}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{CATEGORY_ICONS[job.category] || '💼'}</span>
              <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                {job.category}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
              {job.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{job.company}</p>
          </div>
          {isUser && (
            <button
              onClick={handleSave}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                saved
                  ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30'
                  : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30'
              }`}
            >
              <svg className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t(`jobType.${job.type}`)}
          </span>
          {job.salary?.min > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              {job.salary.min.toLocaleString()} – {job.salary.max.toLocaleString()} {job.salary.currency}
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-400">{t(`experience.${job.experience}`)}</span>
          <span className="text-xs text-gray-400">
            {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
