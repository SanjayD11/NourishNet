import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserCircle, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';

export default function ProfileCompletionBanner() {
  const navigate = useNavigate();
  const { isComplete, isLoading, missingFields } = useProfileCompletion();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if loading, complete, or dismissed
  if (isLoading || isComplete || isDismissed) {
    return null;
  }

  const completionPercentage = Math.round(((4 - missingFields.length) / 4) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-primary"
            />
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <UserCircle className="w-6 h-6 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">
                  Complete your profile to share food
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Add your name, location, and contact details to connect with the community.
                </p>

                {/* Missing fields tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {missingFields.map((field) => (
                    <span
                      key={field}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive"
                    >
                      {field}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => navigate('/profile')}
                    size="sm"
                    className="gap-1.5"
                  >
                    Complete Profile
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {completionPercentage}% complete
                  </span>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => setIsDismissed(true)}
                className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
