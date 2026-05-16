import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services/userService';
import { jobService } from '../../services/jobService';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  employer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const CATEGORY_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500',
  'bg-yellow-500', 'bg-red-500', 'bg-gray-500', 'bg-teal-500', 'bg-pink-500',
];

export default function AdminPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');

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
      jobService.getJobs({ limit: 100 }).then((res) => setJobs(res.data.data));
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

  const handleToggleJob = async (id) => {
    try {
      const res = await jobService.toggleActive(id);
      setJobs((prev) => prev.map((j) => j._id === id ? { ...j, isActive: res.data.data.isActive } : j));
      toast.success(res.data.message);
    } catch {
      toast.error(t('common.error'));
    }
  };

  if (loading) return <Spinner />;

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredJobs = jobs.filter((j) =>
    j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
    j.company.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const TABS = [
    { id: 'stats', label: t('admin.stats'), icon: '📊' },
    { id: 'users', label: t('admin.users'), icon: '👥', count: users.length },
    { id: 'jobs', label: t('admin.jobs'), icon: '💼', count: jobs.length },
  ];

  const maxCategoryCount = Math.max(...(stats?.byCategory?.map((c) => c.count) || [1]));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.title')}</h1>
        <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full font-medium">Admin</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-300'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={t('admin.totalUsers')}
              value={stats.totalUsers}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              color="blue"
            />
            <StatCard
              title={t('admin.totalJobs')}
              value={stats.totalJobs}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              color="green"
            />
            {stats.byRole?.map((r) => (
              <StatCard
                key={r._id}
                title={r._id === 'user' ? 'Ish izlovchilar' : r._id === 'employer' ? 'Ish beruvchilar' : 'Adminlar'}
                value={r.count}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                color={r._id === 'admin' ? 'red' : r._id === 'employer' ? 'blue' : 'purple'}
              />
            ))}
          </div>

          {/* Category breakdown */}
          {stats.byCategory?.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-5">Kategoriya bo'yicha vakansiyalar</h3>
              <div className="space-y-3">
                {[...stats.byCategory].sort((a, b) => b.count - a.count).map((cat, i) => (
                  <div key={cat._id} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-gray-600 dark:text-gray-400 shrink-0">{cat._id}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Ism yoki email orqali qidirish..."
              className="input-field pl-10"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Foydalanuvchi</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Telefon</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ro'yxat sanasi</th>
                    <th className="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{u.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400">{u.phone || '—'}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {t('admin.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">{t('common.noData')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Jobs tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Vakansiya yoki kompaniya nomi..."
              className="input-field pl-10"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vakansiya</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kategoriya</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ko'rishlar</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sana</th>
                    <th className="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredJobs.map((job) => (
                    <tr key={job._id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-gray-900 dark:text-white">{job.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{job.company}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-2 py-0.5 rounded-full">{job.category}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{job.viewCount || 0}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleToggleJob(job._id)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                            job.isActive
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {job.isActive ? '● Faol' : '○ Nofaol'}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(job.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {t('admin.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">{t('common.noData')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800',
  };
  return (
    <div className={`${colors[color]} rounded-2xl p-5 border`}>
      <div className="mb-3">{icon}</div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm mt-1 text-gray-500 dark:text-gray-400">{title}</div>
    </div>
  );
}
