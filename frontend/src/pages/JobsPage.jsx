import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs } from '../store/slices/jobsSlice';
import JobCard from '../components/jobs/JobCard';
import Spinner from '../components/common/Spinner';

const CATEGORIES = ['IT', 'Marketing', 'Design', 'Finance', 'Education', 'Healthcare', 'Engineering', 'Sales', 'Other'];
const EXPERIENCE = ['no-experience', 'junior', 'mid', 'senior'];
const TYPES = ['full-time', 'part-time', 'remote', 'contract', 'internship'];

export default function JobsPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { jobs, pagination, loading } = useSelector((s) => s.jobs);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    experience: '',
    type: '',
    page: 1,
  });

  useEffect(() => {
    dispatch(fetchJobs({ ...filters }));
  }, [dispatch, filters]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleReset = () => {
    setFilters({ search: '', category: '', location: '', experience: '', type: '', page: 1 });
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('jobs.title')}</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar */}
        <aside className="lg:w-72 shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sticky top-20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('jobs.filter.title')}</h3>
              <button onClick={handleReset} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                {t('jobs.filter.reset')}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('jobs.searchLabel')}</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilter('search', e.target.value)}
                  className="input-field"
                  placeholder="Search..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('jobs.filter.location')}</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilter('location', e.target.value)}
                  className="input-field"
                  placeholder="Toshkent..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('jobs.filter.category')}</label>
                <select value={filters.category} onChange={(e) => handleFilter('category', e.target.value)} className="input-field">
                  <option value="">{t('jobs.filter.allCategories')}</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('jobs.filter.experience')}</label>
                <select value={filters.experience} onChange={(e) => handleFilter('experience', e.target.value)} className="input-field">
                  <option value="">{t('jobs.filter.allExperience')}</option>
                  {EXPERIENCE.map((e) => <option key={e} value={e}>{t(`experience.${e}`)}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('jobs.filter.type')}</label>
                <select value={filters.type} onChange={(e) => handleFilter('type', e.target.value)} className="input-field">
                  <option value="">{t('jobs.filter.allTypes')}</option>
                  {TYPES.map((tp) => <option key={tp} value={tp}>{t(`jobType.${tp}`)}</option>)}
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Jobs list */}
        <div className="flex-1">
          {loading ? (
            <Spinner />
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg">{t('jobs.notFound')}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {pagination?.total} {t('jobs.title').toLowerCase()} ({t('jobs.filter.title').toLowerCase()})
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {jobs.map((job) => <JobCard key={job._id} job={job} />)}
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    disabled={filters.page === 1}
                    onClick={() => handleFilter('page', filters.page - 1)}
                    className="btn-secondary disabled:opacity-50"
                  >
                    {t('common.prev')}
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleFilter('page', p)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filters.page === p ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={filters.page === pagination.pages}
                    onClick={() => handleFilter('page', filters.page + 1)}
                    className="btn-secondary disabled:opacity-50"
                  >
                    {t('common.next')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
