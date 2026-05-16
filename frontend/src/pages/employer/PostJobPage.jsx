import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { jobService } from '../../services/jobService';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

const CATEGORIES = ['IT', 'Marketing', 'Design', 'Finance', 'Education', 'Healthcare', 'Engineering', 'Sales', 'Other'];
const EXPERIENCE = ['no-experience', 'junior', 'mid', 'senior'];
const TYPES = ['full-time', 'part-time', 'remote', 'contract', 'internship'];

export default function PostJobPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { type: 'full-time', experience: 'junior', category: 'IT', currency: 'USD' },
  });

  useEffect(() => {
    if (isEdit) {
      jobService.getJob(id).then((res) => {
        const j = res.data.data;
        reset({
          ...j,
          requirements: j.requirements?.join('\n') || '',
          skills: j.skills?.join(', ') || '',
          salaryMin: j.salary?.min,
          salaryMax: j.salary?.max,
          currency: j.salary?.currency || 'USD',
          contactPhone: j.contact?.phone || '',
          contactTelegram: j.contact?.telegram || '',
          contactWebsite: j.contact?.website || '',
        });
      });
    }
  }, [id, isEdit, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        requirements: data.requirements?.split('\n').filter(Boolean) || [],
        skills: data.skills ? data.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        salary: { min: Number(data.salaryMin) || 0, max: Number(data.salaryMax) || 0, currency: data.currency || 'USD' },
        contact: {
          phone: data.contactPhone || '',
          telegram: data.contactTelegram || '',
          website: data.contactWebsite || '',
        },
      };
      delete payload.salaryMin;
      delete payload.salaryMax;
      delete payload.currency;
      delete payload.contactPhone;
      delete payload.contactTelegram;
      delete payload.contactWebsite;

      if (isEdit) {
        const res = await jobService.updateJob(id, payload);
        toast.success(res.data.message || t('job.updated'));
      } else {
        const res = await jobService.createJob(payload);
        toast.success(res.data.message || t('job.created'));
      }
      navigate('/employer/jobs');
    } catch (err) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isEdit ? t('employer.editJob') : t('employer.postJob')}
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">{t('employer.form.title')} *</label>
              <input {...register('title', { required: true })} className="input-field" />
              {errors.title && <p className="error-text">{t('common.required')}</p>}
            </div>
            <div>
              <label className="label">{t('employer.form.company')} *</label>
              <input {...register('company', { required: true })} className="input-field" />
              {errors.company && <p className="error-text">{t('common.required')}</p>}
            </div>
          </div>

          <div>
            <label className="label">{t('employer.form.location')} *</label>
            <input {...register('location', { required: true })} className="input-field" placeholder="Toshkent, O'zbekiston" />
            {errors.location && <p className="error-text">{t('common.required')}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="label">{t('employer.form.category')}</label>
              <select {...register('category')} className="input-field">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('employer.form.experience')}</label>
              <select {...register('experience')} className="input-field">
                {EXPERIENCE.map((e) => <option key={e} value={e}>{t(`experience.${e}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('employer.form.type')}</label>
              <select {...register('type')} className="input-field">
                {TYPES.map((tp) => <option key={tp} value={tp}>{t(`jobType.${tp}`)}</option>)}
              </select>
            </div>
          </div>

          {/* Salary */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">{t('employer.form.salaryMin')}</label>
              <input type="number" {...register('salaryMin')} className="input-field" placeholder="500" />
            </div>
            <div>
              <label className="label">{t('employer.form.salaryMax')}</label>
              <input type="number" {...register('salaryMax')} className="input-field" placeholder="1500" />
            </div>
            <div>
              <label className="label">Valyuta</label>
              <select {...register('currency')} className="input-field">
                <option value="USD">USD</option>
                <option value="UZS">UZS</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">{t('employer.form.description')} *</label>
            <textarea {...register('description', { required: true })} rows={5} className="input-field" />
            {errors.description && <p className="error-text">{t('common.required')}</p>}
          </div>

          {/* Requirements */}
          <div>
            <label className="label">{t('employer.form.requirements')}</label>
            <textarea {...register('requirements')} rows={4} className="input-field" placeholder="React bilish&#10;Node.js tajribasi&#10;Git ko'nikmasi" />
          </div>

          {/* Skills */}
          <div>
            <label className="label">{t('employer.form.skills')}</label>
            <input
              {...register('skills')}
              className="input-field"
              placeholder={t('employer.form.skillsPlaceholder')}
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('employer.form.skills')} (vergul bilan ajrating)</p>
          </div>

          {/* Contact section */}
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {t('employer.form.contactSection')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">{t('employer.form.contactPhone')}</label>
                <input
                  type="tel"
                  {...register('contactPhone')}
                  className="input-field"
                  placeholder="+998 90 123 45 67"
                />
              </div>
              <div>
                <label className="label">{t('employer.form.contactTelegram')}</label>
                <input
                  type="text"
                  {...register('contactTelegram')}
                  className="input-field"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="label">{t('employer.form.contactWebsite')}</label>
                <input
                  type="url"
                  {...register('contactWebsite')}
                  className="input-field"
                  placeholder="https://company.uz"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? t('common.loading') : (isEdit ? t('employer.form.update') : t('employer.form.submit'))}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
