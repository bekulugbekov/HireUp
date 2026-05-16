import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useDarkMode } from '../../hooks/useDarkMode';

const LANGS = [
  { code: 'uz', label: "O'z" },
  { code: 'ru', label: 'Рус' },
  { code: 'en', label: 'Eng' },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, isAdmin, isEmployer, logout } = useAuth();
  const [dark, toggleDark] = useDarkMode();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            Hire<span className="text-gray-800 dark:text-white">Up</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/jobs" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
              {t('nav.jobs')}
            </Link>

            {isAuthenticated && (
              <>
                {isEmployer && (
                  <>
                    <Link to="/employer/post-job" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                      {t('nav.postJob')}
                    </Link>
                    <Link to="/employer/jobs" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                      {t('nav.myJobs')}
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                    {t('nav.admin')}
                  </Link>
                )}
                {!isEmployer && !isAdmin && (
                  <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                    {t('nav.dashboard')}
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => i18n.changeLanguage(l.code)}
                  className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
                    i18n.language === l.code
                      ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              onClick={toggleDark}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {dark ? '☀️' : '🌙'}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{user?.fullName}</span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" className="btn-secondary text-sm">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary text-sm">{t('nav.register')}</Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300"
            onClick={() => setOpen(!open)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Link to="/" className="block px-4 py-2 text-gray-600 dark:text-gray-300" onClick={() => setOpen(false)}>{t('nav.home')}</Link>
            <Link to="/jobs" className="block px-4 py-2 text-gray-600 dark:text-gray-300" onClick={() => setOpen(false)}>{t('nav.jobs')}</Link>
            {isAuthenticated ? (
              <>
                {!isEmployer && !isAdmin && (
                  <Link to="/dashboard" className="block px-4 py-2 text-gray-600 dark:text-gray-300" onClick={() => setOpen(false)}>{t('nav.dashboard')}</Link>
                )}
                {isEmployer && (
                  <>
                    <Link to="/employer/post-job" className="block px-4 py-2 text-gray-600 dark:text-gray-300" onClick={() => setOpen(false)}>{t('nav.postJob')}</Link>
                    <Link to="/employer/jobs" className="block px-4 py-2 text-gray-600 dark:text-gray-300" onClick={() => setOpen(false)}>{t('nav.myJobs')}</Link>
                  </>
                )}
                {isAdmin && (
                  <Link to="/admin" className="block px-4 py-2 text-gray-600 dark:text-gray-300" onClick={() => setOpen(false)}>{t('nav.admin')}</Link>
                )}
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600">{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2 text-gray-600 dark:text-gray-300" onClick={() => setOpen(false)}>{t('nav.login')}</Link>
                <Link to="/register" className="block px-4 py-2 text-primary-600" onClick={() => setOpen(false)}>{t('nav.register')}</Link>
              </>
            )}
            <div className="flex gap-2 px-4 pt-2">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    i18n.language === l.code ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
