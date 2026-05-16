import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { applicationService } from '../../services/applicationService';
import { userService } from '../../services/userService';
import { Link } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('applications');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [appsRes, savedRes] = await Promise.all([
          applicationService.getMyApplications(),
          userService.getSavedJobs(),
        ]);
        setApplications(appsRes.data.data);
        setSavedJobs(savedRes.data.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleWithdraw = async (appId) => {
    if (!window.confirm(t('dashboard.withdrawConfirm'))) return;
    try {
      const res = await applicationService.withdraw(appId);
      setApplications((prev) => prev.filter((a) => a._id !== appId));
      toast.success(res.data.message || t('application.withdrawn'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome')}, {user?.fullName}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
          {user?.title && <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5">{user.title}</p>}
        </div>
        <Link to="/profile" className="btn-secondary self-start sm:self-auto shrink-0">
          <svg className="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {t('nav.profile')}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['applications', 'savedJobs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            {t(`dashboard.${tab}`)}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
              {tab === 'applications' ? applications.length : savedJobs.length}
            </span>
          </button>
        ))}
      </div>

      {/* Applications tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-lg font-medium">{t('dashboard.noApplications')}</p>
              <Link to="/jobs" className="btn-primary mt-4 inline-block">{t('nav.jobs')}</Link>
            </div>
          ) : (
            applications.map((app) => (
              <div key={app._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/jobs/${app.job?._id}`}
                      className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {app.job?.title}
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                      {app.job?.company} • {app.job?.location}
                    </p>

                    {/* Contact info submitted */}
                    {(app.phone || app.telegram) && (
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-600 dark:text-gray-300">{t('dashboard.yourContact')}:</span>
                        {app.phone && (
                          <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {app.phone}
                          </span>
                        )}
                        {app.telegram && (
                          <span className="inline-flex items-center gap-1 text-blue-500">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z" />
                            </svg>
                            {app.telegram}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                      {t(`dashboard.status.${app.status}`)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {t('dashboard.appliedAt')}: {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                  {app.resume && (
                    <a
                      href={`${BACKEND_URL}/${app.resume.replace(/\\/g, '/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {t('dashboard.downloadCV')}
                    </a>
                  )}
                  {app.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(app._id)}
                      className="ml-auto inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {t('dashboard.withdraw')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Saved Jobs tab */}
      {activeTab === 'savedJobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.length === 0 ? (
            <div className="col-span-2 text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">🔖</div>
              <p className="text-lg font-medium">{t('dashboard.noSaved')}</p>
              <Link to="/jobs" className="btn-primary mt-4 inline-block">{t('nav.jobs')}</Link>
            </div>
          ) : (
            savedJobs.map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{job.company} • {job.location}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full">
                    {job.category}
                  </span>
                  {job.salary?.min > 0 && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      {job.salary.min.toLocaleString()}–{job.salary.max.toLocaleString()} {job.salary.currency}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
