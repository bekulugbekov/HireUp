import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { applicationService } from '../../services/applicationService';
import { userService } from '../../services/userService';
import { Link } from 'react-router-dom';
import Spinner from '../../components/common/Spinner';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

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

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard.welcome')}, {user?.fullName}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
      </div>

      <div className="flex gap-2 mb-6">
        {['applications', 'savedJobs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {t(`dashboard.${tab}`)}
            <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
              {tab === 'applications' ? applications.length : savedJobs.length}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">📋</div>
              <p>{t('dashboard.noApplications')}</p>
              <Link to="/jobs" className="btn-primary mt-4 inline-block">{t('nav.jobs')}</Link>
            </div>
          ) : applications.map((app) => (
            <div key={app._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex justify-between items-start">
                <div>
                  <Link to={`/jobs/${app.job?._id}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                    {app.job?.title}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{app.job?.company} • {app.job?.location}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[app.status]}`}>
                  {t(`dashboard.status.${app.status}`)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">{new Date(app.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'savedJobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-3">🔖</div>
              <p>{t('dashboard.noSaved')}</p>
              <Link to="/jobs" className="btn-primary mt-4 inline-block">{t('nav.jobs')}</Link>
            </div>
          ) : savedJobs.map((job) => (
            <Link key={job._id} to={`/jobs/${job._id}`} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{job.company} • {job.location}</p>
              <span className="inline-block mt-2 text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full">
                {job.category}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
