import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchJob } from '../store/slices/jobsSlice';
import { applicationService } from '../services/applicationService';
import { userService } from '../services/userService';
import { messageService } from '../services/messageService';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';
import toast from 'react-hot-toast';

const CATEGORY_ICONS = {
  IT: '💻', Marketing: '📢', Design: '🎨', Finance: '💰',
  Education: '📚', Healthcare: '🏥', Engineering: '⚙️', Sales: '🤝', Other: '💼',
};

export default function JobDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { job, loading } = useSelector((s) => s.jobs);
  const { isAuthenticated, isUser, user } = useAuth();
  const [applying, setApplying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [msgContent, setMsgContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [form, setForm] = useState({ resume: null, coverLetter: '', phone: '', telegram: '' });

  useEffect(() => {
    dispatch(fetchJob(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (user?.savedJobs && job) {
      setIsSaved(user.savedJobs.includes(job._id));
    }
  }, [user, job]);

  const handleSave = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    try {
      await userService.saveJob(id);
      setIsSaved((prev) => !prev);
      toast.success(isSaved ? t('jobs.saveJob') : t('jobs.saved'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!msgContent.trim()) return;
    setSendingMsg(true);
    try {
      await messageService.send({
        receiverId: job.createdBy._id,
        content: msgContent.trim(),
        jobId: job._id,
      });
      toast.success(t('messages.sent'));
      setShowMsgModal(false);
      setMsgContent('');
      navigate(`/messages?with=${job.createdBy._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setSendingMsg(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { navigate('/login'); return; }
    setApplying(true);
    try {
      const res = await applicationService.apply(id, form);
      toast.success(res.data.message || t('application.submitted'));
      setShowForm(false);
      setForm({ resume: null, coverLetter: '', phone: '', telegram: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Spinner />;
  if (!job) return (
    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
      <div className="text-5xl mb-4">🔍</div>
      <p>{t('jobs.notFound')}</p>
    </div>
  );

  const hasContact = job.contact?.phone || job.contact?.telegram || job.contact?.website;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('common.back')}
      </button>

      {/* Main card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{CATEGORY_ICONS[job.category] || '💼'}</span>
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-full">
                  {job.category}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">{job.company}</p>
            </div>
            <div className="flex items-start gap-2 shrink-0 flex-wrap">
              {isUser && (
                <button
                  onClick={handleSave}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isSaved
                      ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-600 dark:text-primary-400'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:text-primary-600 hover:border-primary-200'
                  }`}
                  title={isSaved ? t('jobs.saved') : t('jobs.saveJob')}
                >
                  <svg className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              )}
              {isUser && (
                <button onClick={() => setShowMsgModal(true)} className="btn-secondary">
                  <svg className="w-4 h-4 mr-1.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {t('messages.sendMessage')}
                </button>
              )}
              {isUser && (
                <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                  {t('jobs.applyNow')}
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mt-5">
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t(`jobType.${job.type}`)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-3 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              {t(`experience.${job.experience}`)}
            </span>
            {job.salary?.min > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                {job.salary.min.toLocaleString()} – {job.salary.max.toLocaleString()} {job.salary.currency}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 ml-auto">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {job.viewCount || 0} {t('jobs.views')}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('jobs.about')}</h2>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">{job.description}</p>
          </div>

          {/* Requirements */}
          {job.requirements?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('jobs.requirements')}</h2>
              <ul className="space-y-2">
                {job.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-gray-600 dark:text-gray-400">
                    <span className="text-primary-500 mt-0.5 shrink-0">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('jobs.skills')}</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 text-sm font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-100 dark:border-blue-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          {(hasContact || job.createdBy?.phone || job.createdBy?.telegram) && (
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('jobs.contactInfo')}</h2>
              <div className="space-y-3">
                {job.contact?.phone && (
                  <a href={`tel:${job.contact.phone}`} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group">
                    <span className="w-9 h-9 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-600 group-hover:border-primary-300 transition-colors">
                      <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t('jobs.phone')}</p>
                      <p className="font-medium">{job.contact.phone}</p>
                    </div>
                  </a>
                )}
                {job.contact?.telegram && (
                  <a href={`https://t.me/${job.contact.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors group">
                    <span className="w-9 h-9 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-600 group-hover:border-blue-300 transition-colors">
                      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t('jobs.telegram')}</p>
                      <p className="font-medium">{job.contact.telegram}</p>
                    </div>
                  </a>
                )}
                {job.contact?.website && (
                  <a href={job.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group">
                    <span className="w-9 h-9 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-600 group-hover:border-primary-300 transition-colors">
                      <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t('jobs.website')}</p>
                      <p className="font-medium truncate max-w-xs">{job.contact.website}</p>
                    </div>
                  </a>
                )}
                {/* Employer profile contacts as fallback */}
                {!job.contact?.phone && job.createdBy?.phone && (
                  <a href={`tel:${job.createdBy.phone}`} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors group">
                    <span className="w-9 h-9 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-600 group-hover:border-primary-300 transition-colors">
                      <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t('jobs.phone')}</p>
                      <p className="font-medium">{job.createdBy.phone}</p>
                    </div>
                  </a>
                )}
                {!job.contact?.telegram && job.createdBy?.telegram && (
                  <a href={`https://t.me/${job.createdBy.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-500 transition-colors group">
                    <span className="w-9 h-9 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-600 group-hover:border-blue-300 transition-colors">
                      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.932z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{t('jobs.telegram')}</p>
                      <p className="font-medium">{job.createdBy.telegram}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Footer meta */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-sm text-gray-400 dark:text-gray-500">
            <span>{t('jobs.postedBy')}: <span className="font-medium text-gray-700 dark:text-gray-300">{job.createdBy?.fullName}</span></span>
            <span>{t('jobs.postedAt')}: {new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMsgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('messages.sendMessage')}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{t('messages.to')}: {job.createdBy?.fullName}</p>
              </div>
              <button onClick={() => setShowMsgModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="p-5 space-y-4">
              <div className="text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg">
                {job.title} · {job.company}
              </div>
              <textarea
                value={msgContent}
                onChange={(e) => setMsgContent(e.target.value)}
                rows={4}
                className="input-field"
                placeholder={t('messages.placeholder')}
                autoFocus
                required
              />
              <div className="flex gap-3">
                <button type="submit" disabled={sendingMsg || !msgContent.trim()} className="btn-primary disabled:opacity-60 flex-1">
                  {sendingMsg ? t('common.loading') : t('messages.send')}
                </button>
                <button type="button" onClick={() => setShowMsgModal(false)} className="btn-secondary">
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Form */}
      {showForm && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{t('jobs.applySection')}</h2>
          <form onSubmit={handleApply} className="space-y-5">
            <div>
              <label className="label">{t('application.resume')}</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setForm((f) => ({ ...f, resume: e.target.files[0] }))}
                className="block w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">{t('application.phone')}</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="input-field"
                  placeholder={t('application.phonePlaceholder')}
                />
              </div>
              <div>
                <label className="label">{t('application.telegram')}</label>
                <input
                  type="text"
                  value={form.telegram}
                  onChange={(e) => setForm((f) => ({ ...f, telegram: e.target.value }))}
                  className="input-field"
                  placeholder={t('application.telegramPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="label">{t('application.coverLetter')}</label>
              <textarea
                value={form.coverLetter}
                onChange={(e) => setForm((f) => ({ ...f, coverLetter: e.target.value }))}
                rows={4}
                className="input-field"
                placeholder={t('application.coverLetterPlaceholder')}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={applying} className="btn-primary disabled:opacity-60">
                {applying ? t('common.loading') : t('jobs.applyNow')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
