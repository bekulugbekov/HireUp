import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-xl font-bold mb-3">HireUp</h3>
            <p className="text-gray-400 text-sm">Orzuingizga mos ish toping va karyerangizni boshlang.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">{t('nav.jobs')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/jobs" className="hover:text-white transition-colors">{t('nav.jobs')}</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">{t('nav.register')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <p className="text-sm text-gray-400">info@hireup.uz</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} HireUp. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
