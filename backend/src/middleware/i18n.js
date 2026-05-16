const i18next = require('i18next');
const en = require('../locales/en.json');
const ru = require('../locales/ru.json');
const uz = require('../locales/uz.json');

i18next.init({
  lng: 'uz',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    uz: { translation: uz },
  },
  interpolation: { escapeValue: false },
});

const i18nMiddleware = (req, res, next) => {
  const lang = req.headers['accept-language'] || req.query.lang || 'uz';
  const supported = ['uz', 'ru', 'en'];
  const detected = supported.includes(lang) ? lang : 'uz';
  i18next.changeLanguage(detected);
  req.t = i18next.t.bind(i18next);
  next();
};

module.exports = i18nMiddleware;
