import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { jobService } from '../../services/jobService';
import { applicationService } from '../../services/applicationService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function MyJobsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);
  const [applicants, setApplicants] = useState({});

  useEffect(() => {
    jobService.getMyJobs()
      .then((res) => setJobs(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await jobService.toggleActive(id);
      setJobs((prev) => prev.map((j) => j._id === id ? { ...j, isActive: res.data.data.isActive } : j));
      toast.success(res.data.message);
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      const res = await jobService.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      toast.success(res.data.message || t('job.deleted'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const loadApplicants = async (jobId) => {
    if (expandedJob === jobId) { setExpandedJob(null); return; }
    setExpandedJob(jobId);
    if (!applicants[jobId]) {
      try {
        const res = await applicationService.getJobApplications(jobId);
        setApplicants((prev) => ({ ...prev, [jobId]: res.data.data }));
      } catch {
        toast.error(t('common.error'));
      }
    }
  };

  const updateStatus = async (appId, status, jobId) => {
    try {
      const res = await applicationService.updateStatus(appId, status);
      setApplicants((prev) => ({
        ...prev,
        [jobId]: prev[jobId].map((a) => a._id === appId ? { ...a, status } : a),
      }));
      toast.success(res.data.message || t('application.updated'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('employer.myJobs')}</h1>
        <Link to="/employer/post-job" className="btn-primary">{t('employer.postJob')}</Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p>{t('employer.noJobs')}</p>
          <Link to="/employer/post-job" className="btn-primary mt-4 inline-block">{t('employer.postJob')}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${job.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                      {job.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{job.company} • {job.location}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                    <span>👁 {job.viewCount || 0} {t('jobs.views')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(job._id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      job.isActive
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {job.isActive ? '● Faol' : '○ Nofaol'}
                  </button>
                  <button
                    onClick={() => loadApplicants(job._id)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      expandedJob === job._id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400'
                    }`}
                  >
                    {t('employer.applicants')}
                    {applicants[job._id] && (
                      <span className="ml-1.5 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                        {applicants[job._id].length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/employer/edit-job/${job._id}`)}
                    className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="text-xs px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>

              {/* Applicants panel */}
              {expandedJob === job._id && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 p-5">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">{t('employer.applicants')}</h4>
                  {!applicants[job._id] ? (
                    <Spinner />
                  ) : applicants[job._id].length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('employer.noApplicants')}</p>
                  ) : (
                    <div className="space-y-3">
                      {applicants[job._id].map((app) => (
                        <div key={app._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {app.user?.avatar ? (
                                <img src={`${BACKEND_URL}/${app.user.avatar}`} alt="" className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-semibold text-sm">
                                  {app.user?.fullName?.[0]?.toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{app.user?.fullName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{app.user?.email}</p>
                              </div>
                            </div>
                            <select
                              value={app.status}
                              onChange={(e) => updateStatus(app._id, e.target.value, job._id)}
                              className={`text-xs border rounded-lg px-2 py-1.5 font-medium cursor-pointer ${STATUS_COLORS[app.status]} border-current`}
                            >
                              {['pending', 'reviewed', 'accepted', 'rejected'].map((s) => (
                                <option key={s} value={s}>{t(`dashboard.status.${s}`)}</option>
                              ))}
                            </select>
                          </div>

                          {/* Contact & CV info */}
                          <div className="mt-3 flex flex-wrap gap-3 text-xs">
                            {(app.phone || app.user?.phone) && (
                              <a href={`tel:${app.phone || app.user?.phone}`} className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {app.phone || app.user?.phone}
                              </a>
                            )}
                            {(app.telegram || app.user?.telegram) && (
                              <a href={`https://t.me/${(app.telegram || app.user?.telegram).replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-600">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z" />
                                </svg>
                                {app.telegram || app.user?.telegram}
                              </a>
                            )}
                            {app.resume && (
                              <a
                                href={`${BACKEND_URL}/${app.resume}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-primary-600 dark:text-primary-400 hover:underline font-medium"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t('employer.applicant.cv')}
                              </a>
                            )}
                          </div>

                          {app.coverLetter && (
                            <div className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 line-clamp-3">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{t('employer.applicant.coverLetter')}: </span>
                              {app.coverLetter}
                            </div>
                          )}

                          <p className="text-xs text-gray-400 mt-2">{new Date(app.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
