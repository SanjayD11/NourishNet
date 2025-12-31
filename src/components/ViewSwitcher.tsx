import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Grid3X3, List, LayoutGrid, Columns } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect } from 'react';

export type ViewType = 'list' | 'grid' | 'card' | 'compact' | 'mosaic';

interface ViewSwitcherProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const allViewOptions = [
  { id: 'grid' as const, label: 'Grid', icon: Grid3X3, description: 'Modern grid layout' },
  { id: 'card' as const, label: 'Cards', icon: LayoutGrid, description: 'Featured card view' },
  { id: 'list' as const, label: 'List', icon: List, description: 'Detailed list view' },
  { id: 'compact' as const, label: 'Compact', icon: Columns, description: 'Space-efficient view' }
];

// Mobile-only views: Cards and Compact
const mobileViewOptions = allViewOptions.filter(v => v.id === 'card' || v.id === 'compact');

export default function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const isMobile = useIsMobile();
  
  // Auto-fallback to Cards if user had Grid/List selected on mobile
  useEffect(() => {
    if (isMobile && (currentView === 'grid' || currentView === 'list')) {
      onViewChange('card');
    }
  }, [isMobile, currentView, onViewChange]);
  
  // Use filtered options on mobile, all options on desktop/tablet
  const viewOptions = isMobile ? mobileViewOptions : allViewOptions;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden lg:inline">View:</span>
      <Card className="glass-panel border-0 px-1 py-1 shadow-sm backdrop-blur-sm max-w-full overflow-hidden">
        <div className="flex items-center gap-1">
          {viewOptions.map((option) => {
            const Icon = option.icon;
            const isActive = currentView === option.id;
            
            return (
              <motion.button
                key={option.id}
                type="button"
                onClick={() => onViewChange(option.id)}
                className="relative group rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeViewBackground"
                    className="absolute inset-0 bg-primary rounded-md shadow-lg"
                    style={{ zIndex: 0 }}
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                  />
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className={`relative z-[1] px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-medium transition-all duration-300 hover:scale-105 min-w-[3rem] justify-center ${
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                  aria-label={`Switch to ${option.label} view - ${option.description}`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                  <span className="hidden sm:inline">{option.label}</span>
                </Button>

                {/* Tooltip on hover */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  <div className="bg-background border border-border rounded-md px-2 py-1 text-xs whitespace-nowrap shadow-lg">
                    {option.description}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
