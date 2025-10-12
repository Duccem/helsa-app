import { ReactNode, useEffect } from "react";
import { useLanguage } from "./use-language";
import { setLocale } from "./index";


export function LanguageProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();

  useEffect(() => {
    setLocale(language);
  }, [language]);

  return <>{children}</>;
}

export default LanguageProvider;