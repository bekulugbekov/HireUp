import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/userService';
import { jobService } from '../../services/jobService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          userService.getStats(),
          userService.getAllUsers(),
        ]);
        setStats(statsRes.data.data);
        setUsers(usersRes.data.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (activeTab === 'jobs' && jobs.length === 0) {
      jobService.getJobs({ limit: 50 }).then((res) => setJobs(res.data.data));
    }
  }, [activeTab, jobs.length]);

  const handleDeleteUser = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      const res = await userService.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success(res.data.message || t('user.deleted'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    try {
      const res = await jobService.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      toast.success(res.data.message || t('job.deleted'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  if (loading) return <Spinner />;

  const TABS = ['stats', 'users', 'jobs'];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('admin.title')}</h1>

      <div className="flex gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {t(`admin.${tab}`)}
          </button>
        ))}
      </div>

      {/* Stats */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard title={t('admin.totalUsers')} value={stats.totalUsers} icon="👥" color="blue" />
          <StatCard title={t('admin.totalJobs')} value={stats.totalJobs} icon="💼" color="green" />
          {stats.byRole?.map((r) => (
            <StatCard key={r._id} title={r._id} value={r.count} icon="👤" color="purple" />
          ))}
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">Ism</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">Email</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">Rol</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-medium">Sana</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{u.fullName}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      u.role === 'employer' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-700 text-xs">
                      {t('admin.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Jobs */}
      {activeTab === 'jobs' && (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{job.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{job.company} • {job.category}</p>
              </div>
              <button onClick={() => handleDeleteJob(job._id)} className="text-red-500 hover:text-red-700 text-sm">
                {t('admin.delete')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
  };
  return (
    <div className={`${colors[color]} rounded-xl p-5`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-80">{title}</div>
    </div>
  );
}
