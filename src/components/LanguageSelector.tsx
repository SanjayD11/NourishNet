import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

type Language = 'en' | 'ta' | 'hi';

const languages: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
];

// Extend window type for TypeScript
declare global {
  interface Window {
    changeLanguage: (lang: string) => void;
  }
}

export function LanguageSelector() {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('nourishnet_lang');
    return (saved as Language) || 'en';
  });

  // Sync with localStorage changes
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('nourishnet_lang');
      if (saved) {
        setCurrentLanguage(saved as Language);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setCurrentLanguage(lang);
    
    // Use the global changeLanguage function from index.html
    if (window.changeLanguage) {
      window.changeLanguage(lang);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:bg-accent"
          title="Select Language"
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">Select Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center justify-between cursor-pointer ${
              currentLanguage === lang.code ? 'bg-accent' : ''
            }`}
          >
            <span>{lang.nativeLabel}</span>
            {currentLanguage === lang.code && (
              <span className="text-xs text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
