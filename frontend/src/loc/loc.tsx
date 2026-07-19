import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Language = 'en' | 'sr';

type TranslationMap = Record<string, string>;

interface LanguageContextType {
  locale: Language;
  setLocale: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [locale, setLocale] = useState<Language>('en');
  const [loading, setLoading] = useState(true);

  const [translations, setTranslations] = useState<
    Record<Language, TranslationMap>
  >({
    en: {},
    sr: {},
  });

  useEffect(() => {
    loadLanguage(locale);
  }, [locale]);

  async function loadLanguage(language: Language) {
    // Skip if already loaded
    if (Object.keys(translations[language]).length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const languageId = language === 'en' ? 1 : 3;

    const response = await fetch(`https://dash.enpay.rs/localization/getByLanguageId/${languageId}`);

    const json: TranslationMap = await response.json();

    setTranslations(prev => ({
      ...prev,
      [language]: json,
    }));

    setLoading(false);
  }

  function t(
    key: string,
    variables?: Record<string, string | number>
  ) {
    let message = translations[locale][key] ?? key;

    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        message = message.replace(`{{${k}}}`, String(v));
      });
    }

    return message;
  }

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        loading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context)
    throw new Error(
      'useTranslation must be used within LanguageProvider'
    );

  return context;
}