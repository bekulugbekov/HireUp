import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJobs } from '../store/slices/jobsSlice';
import JobCard from '../components/jobs/JobCard';
import Spinner from '../components/common/Spinner';

const CATEGORIES = [
  { name: 'IT', icon: '💻', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
  { name: 'Design', icon: '🎨', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
  { name: 'Marketing', icon: '📢', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' },
  { name: 'Finance', icon: '💰', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
  { name: 'Education', icon: '📚', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' },
  { name: 'Healthcare', icon: '🏥', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' },
  { name: 'Engineering', icon: '⚙️', color: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
  { name: 'Sales', icon: '🤝', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300' },
];

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { jobs, loading } = useSelector((s) => s.jobs);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    dispatch(fetchJobs({ limit: 6 }));
  }, [dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (location) params.set('location', location);
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            {t('home.hero.title')}
          </h1>
          <p className="text-primary-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            {t('home.hero.subtitle')}
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('home.hero.searchPlaceholder')}
              className="flex-1 px-5 py-3 rounded-xl text-gray-900 outline-none shadow-sm"
            />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t('home.hero.locationPlaceholder')}
              className="flex-1 px-5 py-3 rounded-xl text-gray-900 outline-none shadow-sm"
            />
            <button type="submit" className="bg-white text-primary-600 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors whitespace-nowrap shadow-sm">
              {t('home.hero.searchBtn')}
            </button>
          </form>

          <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: '1200+', label: t('home.hero.stats.jobs') },
              { value: '350+', label: t('home.hero.stats.companies') },
              { value: '5000+', label: t('home.hero.stats.applicants') },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-primary-200 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('home.categories.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">{t('home.categories.subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/jobs?category=${cat.name}`}
                className={`${cat.color} rounded-xl p-4 text-center hover:shadow-md transition-all duration-200 group`}
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <div className="font-semibold text-sm">{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="py-16 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('home.latest.title')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{t('home.latest.subtitle')}</p>
            </div>
            <Link to="/jobs" className="btn-primary hidden sm:block">{t('home.latest.viewAll')}</Link>
          </div>

          {loading ? (
            <Spinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.slice(0, 6).map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link to="/jobs" className="btn-primary">{t('home.latest.viewAll')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
