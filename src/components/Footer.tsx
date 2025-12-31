import { Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 dark:bg-muted/10 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-7 h-7 bg-primary rounded-lg group-hover:scale-105 transition-transform">
              <Leaf className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground/80">NourishNet</span>
          </Link>
          
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            © 2025 NourishNet. Reducing food waste, one meal at a time.
          </p>
        </div>
      </div>
    </footer>
  );
}
