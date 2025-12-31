import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpiryBadgeProps {
  bestBefore?: string | null;
  className?: string;
  showIcon?: boolean;
}

export type ExpiryUrgency = 'safe' | 'warning' | 'critical' | 'expired';

export function getExpiryInfo(bestBefore?: string | null): { 
  urgency: ExpiryUrgency; 
  hoursLeft: number; 
  label: string 
} {
  if (!bestBefore) {
    return { urgency: 'safe', hoursLeft: Infinity, label: 'No expiry set' };
  }

  const now = new Date();
  const expiryDate = new Date(bestBefore);
  const diffMs = expiryDate.getTime() - now.getTime();
  const hoursLeft = diffMs / (1000 * 60 * 60);

  if (hoursLeft <= 0) {
    return { urgency: 'expired', hoursLeft: 0, label: 'Expired' };
  }

  if (hoursLeft < 3) {
    const minutes = Math.floor(hoursLeft * 60);
    if (minutes < 60) {
      return { urgency: 'critical', hoursLeft, label: `${minutes}m left` };
    }
    return { urgency: 'critical', hoursLeft, label: `${hoursLeft.toFixed(1)}h left` };
  }

  if (hoursLeft < 12) {
    return { urgency: 'warning', hoursLeft, label: `${Math.floor(hoursLeft)}h left` };
  }

  if (hoursLeft < 24) {
    return { urgency: 'safe', hoursLeft, label: `${Math.floor(hoursLeft)}h left` };
  }

  const daysLeft = Math.floor(hoursLeft / 24);
  return { urgency: 'safe', hoursLeft, label: `${daysLeft}d left` };
}

export default function ExpiryBadge({ bestBefore, className, showIcon = true }: ExpiryBadgeProps) {
  const { urgency, label } = useMemo(() => getExpiryInfo(bestBefore), [bestBefore]);

  if (!bestBefore) return null;

  const urgencyStyles: Record<ExpiryUrgency, string> = {
    safe: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
    warning: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
    critical: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30 animate-pulse',
    expired: 'bg-destructive/20 text-destructive border-destructive/30 line-through opacity-70',
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[10px] sm:text-xs font-medium px-1.5 py-0.5 gap-1",
        urgencyStyles[urgency],
        className
      )}
    >
      {showIcon && <Clock className="w-3 h-3" />}
      {label}
    </Badge>
  );
}
