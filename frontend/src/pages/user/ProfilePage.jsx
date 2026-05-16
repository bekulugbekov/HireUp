import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import { setUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const LANGUAGES = [{ value: 'uz', label: "O'zbek" }, { value: 'ru', label: 'Русский' }, { value: 'en', label: 'English' }];

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    title: user?.title || '',
    bio: user?.bio || '',
    phone: user?.phone || '',
    telegram: user?.telegram || '',
    language: user?.language || 'uz',
    avatar: null,
  });
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ? `${BACKEND_URL}/${user.avatar.replace(/\\/g, '/')}` : null
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const [activeTab, setActiveTab] = useState('personal');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfile((p) => ({ ...p, avatar: file }));
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await userService.updateProfile(profile);
      const updatedUser = res.data.data;
      dispatch(setUser(updatedUser));
      if (updatedUser.avatar) {
        setAvatarPreview(`${BACKEND_URL}/${updatedUser.avatar.replace(/\\/g, '/')}`);
      }
      setProfile((p) => ({ ...p, avatar: null }));
      if (profile.language !== user?.language) i18n.changeLanguage(profile.language);
      toast.success(t('profile.updated'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error(t('profile.passwordMismatch'));
      return;
    }
    setSavingPassword(true);
    try {
      await userService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success(t('profile.passwordChanged'));
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSavingPassword(false);
    }
  };

  const tabs = [
    { id: 'personal', label: t('profile.personalInfo') },
    { id: 'contact', label: t('profile.contactInfo') },
    { id: 'security', label: t('profile.security') },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('profile.title')}</h1>

      {/* Avatar section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-primary-700 dark:text-primary-400">
                  {user?.fullName?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-lg">{user?.fullName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            {user?.title && <p className="text-sm text-primary-600 dark:text-primary-400 mt-0.5">{user.title}</p>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Personal info tab */}
      {activeTab === 'personal' && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">{t('profile.fullName')}</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">{t('profile.title')}</label>
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))}
                className="input-field"
                placeholder="Frontend Developer"
              />
            </div>
          </div>

          <div>
            <label className="label">{t('profile.bio')}</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              rows={4}
              maxLength={500}
              className="input-field"
              placeholder={t('profile.bioPlaceholder')}
            />
            <p className="text-xs text-gray-400 text-right mt-1">{profile.bio.length}/500</p>
          </div>

          <div>
            <label className="label">{t('profile.language')}</label>
            <select
              value={profile.language}
              onChange={(e) => setProfile((p) => ({ ...p, language: e.target.value }))}
              className="input-field"
            >
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          <button type="submit" disabled={savingProfile} className="btn-primary disabled:opacity-60 w-full sm:w-auto">
            {savingProfile ? t('common.loading') : t('profile.saveChanges')}
          </button>
        </form>
      )}

      {/* Contact info tab */}
      {activeTab === 'contact' && (
        <form onSubmit={handleSaveProfile} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <div>
            <label className="label">{t('profile.email')}</label>
            <input type="email" value={user?.email || ''} disabled className="input-field opacity-60 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email o'zgartirib bo'lmaydi</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">{t('profile.phone')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </span>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  className="input-field pl-10"
                  placeholder={t('profile.phonePlaceholder')}
                />
              </div>
            </div>
            <div>
              <label className="label">{t('profile.telegram')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={profile.telegram}
                  onChange={(e) => setProfile((p) => ({ ...p, telegram: e.target.value }))}
                  className="input-field pl-10"
                  placeholder={t('profile.telegramPlaceholder')}
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={savingProfile} className="btn-primary disabled:opacity-60 w-full sm:w-auto">
            {savingProfile ? t('common.loading') : t('profile.saveChanges')}
          </button>
        </form>
      )}

      {/* Security tab */}
      {activeTab === 'security' && (
        <form onSubmit={handleChangePassword} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('profile.changePassword')}</h3>
          <div>
            <label className="label">{t('profile.currentPassword')}</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">{t('profile.newPassword')}</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                className="input-field"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="label">{t('profile.confirmPassword')}</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                className="input-field"
                required
              />
            </div>
          </div>
          {passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
            <p className="text-sm text-red-500">{t('profile.passwordMismatch')}</p>
          )}
          <button type="submit" disabled={savingPassword} className="btn-primary disabled:opacity-60 w-full sm:w-auto">
            {savingPassword ? t('common.loading') : t('profile.changePassword')}
          </button>
        </form>
      )}
    </div>
  );
}
