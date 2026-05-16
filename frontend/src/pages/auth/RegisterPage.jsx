import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { role: 'user' } });

  useEffect(() => {
    if (isAuthenticated) navigate('/');
    return () => dispatch(clearError());
  }, [isAuthenticated, navigate, dispatch]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const onSubmit = (data) => dispatch(registerUser(data));

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.register.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('auth.register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.register.fullName')}</label>
              <input
                {...register('fullName', { required: t('common.required') })}
                className="input-field"
                placeholder="Ism Familiya"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.register.email')}</label>
              <input
                type="email"
                {...register('email', { required: t('common.required') })}
                className="input-field"
                placeholder="email@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('auth.register.password')}</label>
              <input
                type="password"
                {...register('password', { required: t('common.required'), minLength: { value: 6, message: 'Min 6 ta belgi' } })}
                className="input-field"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('auth.register.role')}</label>
              <div className="grid grid-cols-2 gap-3">
                {['user', 'employer'].map((role) => (
                  <label key={role} className="relative cursor-pointer">
                    <input type="radio" value={role} {...register('role')} className="sr-only peer" />
                    <div className="border-2 border-gray-200 dark:border-gray-600 peer-checked:border-primary-600 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20 rounded-xl p-3 text-center transition-all">
                      <div className="text-2xl mb-1">{role === 'user' ? '👤' : '🏢'}</div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t(`auth.register.${role}`)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? t('common.loading') : t('auth.register.submit')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              {t('auth.register.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
