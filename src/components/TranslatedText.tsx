import React from 'react';
import { useTranslatedText } from '@/hooks/useTranslation';
import { Skeleton } from '@/components/ui/skeleton';

interface TranslatedTextProps {
  text: string;
  className?: string;
  showLoading?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({
  text,
  className = '',
  showLoading = false,
  as: Component = 'span',
}) => {
  const { text: translatedText, isLoading } = useTranslatedText(text);

  if (showLoading && isLoading) {
    return <Skeleton className={`h-4 w-20 inline-block ${className}`} />;
  }

  return <Component className={className}>{translatedText}</Component>;
};

// For wrapping existing content that might need translation
interface TranslatedContentProps {
  children: string;
  className?: string;
}

export const TranslatedContent: React.FC<TranslatedContentProps> = ({
  children,
  className,
}) => {
  const { text } = useTranslatedText(children);
  return <span className={className}>{text}</span>;
};

export default TranslatedText;
