import * as SecureStore from "expo-secure-store";
import { useState } from "react";
const LANGUAGE_KEY = "language";

export const useLanguage = () => {
  const [language, setLanguageState] = useState<"en" | "es">("en");
  const getLanguage = async (): Promise<"en" | "es"> => {
    const language = (await SecureStore.getItemAsync(LANGUAGE_KEY)) as
      | "en"
      | "es"
      | null;
    setLanguageState(language ?? "en");
    return language ?? "en";
  }
  const setLanguage = async (language: "en" | "es") => {
    setLanguageState(language);
    await SecureStore.setItemAsync(LANGUAGE_KEY, language);
  }
  getLanguage();
  return { setLanguage, language };
};