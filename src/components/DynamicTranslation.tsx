import React, { useState, useEffect, memo } from 'react';
import { useLanguage } from '@/providers/LanguageProvider';
import { translateText } from '@/hooks/useTranslation';
import { Skeleton } from '@/components/ui/skeleton';

interface DynamicTranslationProps {
  text: string;
  className?: string;
  showLoading?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Wraps dynamic/user-generated text and auto-translates it
 * when the language changes. Uses caching for performance.
 */
const DynamicTranslation: React.FC<DynamicTranslationProps> = memo(({
  text,
  className = '',
  showLoading = false,
  as: Component = 'span',
}) => {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!text) {
      setTranslatedText('');
      return;
    }

    // If English, use original text
    if (language === 'en') {
      setTranslatedText(text);
      return;
    }

    // Translate dynamic content
    setIsLoading(true);
    translateText(text, language)
      .then(result => {
        setTranslatedText(result);
      })
      .catch(() => {
        setTranslatedText(text); // Fallback to original
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [text, language]);

  if (showLoading && isLoading) {
    return <Skeleton className={`h-4 w-20 inline-block ${className}`} />;
  }

  return <Component className={className}>{translatedText}</Component>;
});

DynamicTranslation.displayName = 'DynamicTranslation';

export default DynamicTranslation;
