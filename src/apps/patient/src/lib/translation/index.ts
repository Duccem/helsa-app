import { getLocales } from "expo-localization";
import { I18n, TranslateOptions } from "i18n-js";

import en from "./locales/en";
import es from "./locales/es";

const translations = { en, es } as const;

// Try to detect the device locale, e.g. "en-US" -> "en"
const deviceLocale = (() => {
  try {
    const locales = getLocales();
    const tag = locales?.[0]?.languageTag ?? "en";
    const language = tag.split("-")[0]?.toLowerCase();
    return language === "es" ? "es" : "en";
  } catch {
    return "en";
  }
})();

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.locale = deviceLocale;

export const t = (key: string, options?: TranslateOptions) =>
  i18n.t(key, options);
export const getCurrentLocale = () => i18n.locale as "en" | "es";
export const setLocale = (locale: "en" | "es") => {
  i18n.locale = locale;
};

export default i18n;

