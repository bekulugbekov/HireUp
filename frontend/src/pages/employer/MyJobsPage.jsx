import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { jobService } from '../../services/jobService';
import { applicationService } from '../../services/applicationService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

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
      const res = await applicationService.getJobApplications(jobId);
      setApplicants((prev) => ({ ...prev, [jobId]: res.data.data }));
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${job.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                      {job.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{job.company} • {job.location}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(job.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => loadApplicants(job._id)}
                    className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    {t('employer.applicants')}
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

              {expandedJob === job._id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-5">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">{t('employer.applicants')}</h4>
                  {!applicants[job._id] ? (
                    <Spinner size="sm" />
                  ) : applicants[job._id].length === 0 ? (
                    <p className="text-sm text-gray-500">{t('common.noData')}</p>
                  ) : (
                    <div className="space-y-3">
                      {applicants[job._id].map((app) => (
                        <div key={app._id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{app.user?.fullName}</p>
                            <p className="text-xs text-gray-500">{app.user?.email}</p>
                          </div>
                          <select
                            value={app.status}
                            onChange={(e) => updateStatus(app._id, e.target.value, job._id)}
                            className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          >
                            {['pending', 'reviewed', 'accepted', 'rejected'].map((s) => (
                              <option key={s} value={s}>{t(`dashboard.status.${s}`)}</option>
                            ))}
                          </select>
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
