// locales/en.ts
export const en = {
  welcome: 'Welcome to our app!',
  logout: 'Log Out',
  items_count: 'You have {{count}} items.',
};

// locales/es.ts
export const es = {
  welcome: '¡Bienvenido a nuestra aplicación!',
  logout: 'Cerrar sesión',
  items_count: 'Tienes {{count}} artículos.',
};

// context/LanguageContext.tsx
import { createContext, useState, useContext, type ReactNode } from 'react';

const translations = { en, es };
type Language = keyof typeof translations;

interface LanguageContextType {
  locale: Language;
  setLocale: (lang: Language) => void;
  t: (key: keyof typeof en, variables?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Read initial device language or defaults from localStorage if available
  const [locale, setLocale] = useState<Language>('en');

  // Simple key interpolation engine for dynamic values
  const t = (key: keyof typeof en, variables?: Record<string, string | number>) => {
    let message = translations[locale][key] || translations['en'][key] || String(key);

    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        message = message.replace(`{{${varKey}}}`, String(varValue));
      });
    }
    return message;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
  );
};

// Custom hook for easier consumer component injections
export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within a LanguageProvider');
  return context;
};
