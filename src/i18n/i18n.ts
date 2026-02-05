import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import tr from "./locales/tr.json";

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: "tr", // şimdilik default TR
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
