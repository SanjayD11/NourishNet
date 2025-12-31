import { useState, useCallback, useEffect, useRef } from 'react';
import { useLanguage, Language } from '@/providers/LanguageProvider';

// Cache for translations to avoid repeated API calls
const translationCache = new Map<string, string>();

const getLanguageCode = (lang: Language): string => {
  switch (lang) {
    case 'ta': return 'ta';
    case 'hi': return 'hi';
    default: return 'en';
  }
};

const getCacheKey = (text: string, targetLang: Language): string => {
  return `${text}::${targetLang}`;
};

export const translateText = async (
  text: string,
  targetLang: Language
): Promise<string> => {
  if (!text || text.trim() === '') return text;
  if (targetLang === 'en') return text; // Assume source is English
  
  const cacheKey = getCacheKey(text, targetLang);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const langCode = getLanguageCode(targetLang);
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${langCode}`
    );
    
    if (!response.ok) {
      console.warn('Translation API error:', response.status);
      return text;
    }
    
    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      translationCache.set(cacheKey, translated);
      return translated;
    }
    
    return text;
  } catch (error) {
    console.warn('Translation failed:', error);
    return text;
  }
};

// Hook for translating a single piece of text
export const useTranslatedText = (originalText: string): { text: string; isLoading: boolean } => {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isLoading, setIsLoading] = useState(false);
  const prevLangRef = useRef(language);
  const prevTextRef = useRef(originalText);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedText(originalText);
      return;
    }

    // Check cache first
    const cacheKey = getCacheKey(originalText, language);
    if (translationCache.has(cacheKey)) {
      setTranslatedText(translationCache.get(cacheKey)!);
      return;
    }

    // Only translate if language or text changed
    if (prevLangRef.current === language && prevTextRef.current === originalText) {
      return;
    }

    prevLangRef.current = language;
    prevTextRef.current = originalText;

    setIsLoading(true);
    translateText(originalText, language)
      .then(setTranslatedText)
      .finally(() => setIsLoading(false));
  }, [originalText, language]);

  return { text: translatedText, isLoading };
};

// Hook for batch translating multiple texts
export const useBatchTranslation = (texts: string[]): { translations: string[]; isLoading: boolean } => {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<string[]>(texts);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (language === 'en') {
      setTranslations(texts);
      return;
    }

    const translateAll = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.all(
          texts.map(text => translateText(text, language))
        );
        setTranslations(results);
      } finally {
        setIsLoading(false);
      }
    };

    translateAll();
  }, [texts, language]);

  return { translations, isLoading };
};

// Utility to clear cache if needed
export const clearTranslationCache = () => {
  translationCache.clear();
};
