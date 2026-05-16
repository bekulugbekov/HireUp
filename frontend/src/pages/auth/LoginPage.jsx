import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated) navigate('/');
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const onSubmit = (data) => dispatch(loginUser(data));

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.login.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('auth.login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.login.email')}</label>
              <input
                type="email"
                {...register('email', { required: t('common.required') })}
                className="input-field"
                placeholder="email@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.login.password')}</label>
              <input
                type="password"
                {...register('password', { required: t('common.required') })}
                className="input-field"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? t('common.loading') : t('auth.login.submit')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              {t('auth.login.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
