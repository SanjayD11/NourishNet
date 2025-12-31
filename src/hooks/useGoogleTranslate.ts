import { useEffect, useCallback, useState } from 'react';

export type TranslateLanguage = 'en' | 'ta' | 'hi';

const LANGUAGE_STORAGE_KEY = 'nourishnet-language';

// Language code mapping for Google Translate
const languageMap: Record<TranslateLanguage, string> = {
  en: 'en',
  ta: 'ta',
  hi: 'hi',
};

export function useGoogleTranslate() {
  const [isReady, setIsReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<TranslateLanguage>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (saved as TranslateLanguage) || 'en';
  });

  // Check if Google Translate is loaded
  useEffect(() => {
    const checkGoogleTranslate = () => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        setIsReady(true);
        // Apply saved language on load
        const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLang && savedLang !== 'en') {
          setTimeout(() => {
            changeLanguage(savedLang as TranslateLanguage);
          }, 500);
        }
      }
    };

    // Listen for Google Translate ready event
    window.addEventListener('googleTranslateReady', () => {
      // Give it a moment to fully initialize
      setTimeout(checkGoogleTranslate, 1000);
    });

    // Also check periodically in case we missed the event
    const interval = setInterval(checkGoogleTranslate, 500);
    const timeout = setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const changeLanguage = useCallback((lang: TranslateLanguage) => {
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    
    if (!select) {
      console.warn('Google Translate not ready yet');
      return false;
    }

    const googleLangCode = languageMap[lang];
    
    // For English, we need to restore original
    if (lang === 'en') {
      // Find and click the "Show original" link or reset
      const frame = document.querySelector('.goog-te-banner-frame') as HTMLIFrameElement;
      if (frame && frame.contentDocument) {
        const restoreBtn = frame.contentDocument.querySelector('.goog-te-button');
        if (restoreBtn) {
          (restoreBtn as HTMLElement).click();
        }
      }
      
      // Alternative: Set to empty/original
      select.value = '';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Remove the googtrans cookie
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
    } else {
      select.value = googleLangCode;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Save preference
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    setCurrentLanguage(lang);
    
    return true;
  }, []);

  return {
    isReady,
    currentLanguage,
    changeLanguage,
  };
}
