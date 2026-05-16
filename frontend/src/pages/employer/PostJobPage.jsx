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
    defaultValues: { type: 'full-time', experience: 'junior', category: 'IT' },
  });

  useEffect(() => {
    if (isEdit) {
      jobService.getJob(id).then((res) => {
        const j = res.data.data;
        reset({
          ...j,
          requirements: j.requirements?.join('\n') || '',
          salaryMin: j.salary?.min,
          salaryMax: j.salary?.max,
          currency: j.salary?.currency,
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
        salary: { min: Number(data.salaryMin) || 0, max: Number(data.salaryMax) || 0, currency: data.currency || 'USD' },
      };
      delete payload.salaryMin;
      delete payload.salaryMax;
      delete payload.currency;

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">{t('employer.form.title')}</label>
              <input {...register('title', { required: true })} className="input-field" />
              {errors.title && <p className="error-text">*</p>}
            </div>
            <div>
              <label className="label">{t('employer.form.company')}</label>
              <input {...register('company', { required: true })} className="input-field" />
              {errors.company && <p className="error-text">*</p>}
            </div>
          </div>

          <div>
            <label className="label">{t('employer.form.location')}</label>
            <input {...register('location', { required: true })} className="input-field" placeholder="Toshkent, O'zbekiston" />
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

          <div>
            <label className="label">{t('employer.form.description')}</label>
            <textarea {...register('description', { required: true })} rows={5} className="input-field" />
            {errors.description && <p className="error-text">*</p>}
          </div>

          <div>
            <label className="label">{t('employer.form.requirements')}</label>
            <textarea {...register('requirements')} rows={4} className="input-field" placeholder="React bilish&#10;Node.js tajribasi&#10;Git ko'nikmasi" />
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
