import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  giverId: string;
  postId: string;
  giverName: string;
}

export function FeedbackModal({ open, onOpenChange, giverId, postId, giverName }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isReporting && rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating before submitting',
        variant: 'destructive',
      });
      return;
    }

    if (isReporting && !reportReason.trim()) {
      toast({
        title: 'Report reason required',
        description: 'Please provide a reason for reporting',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('feedback').insert({
        giver_id: giverId,
        receiver_id: user.id,
        post_id: postId,
        rating: isReporting ? null : rating,
        report_reason: isReporting ? reportReason : null,
        is_report: isReporting,
      });

      if (error) throw error;

      toast({
        title: isReporting ? 'Report submitted' : 'Thank you for your feedback!',
        description: isReporting 
          ? 'We will review this report shortly.'
          : `You rated ${giverName} ${rating} stars.`,
      });

      onOpenChange(false);
      setRating(0);
      setReportReason('');
      setIsReporting(false);
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isReporting ? 'Report Food Provider' : 'Rate Your Experience'}
          </DialogTitle>
          <DialogDescription>
            {isReporting 
              ? `Report ${giverName} if there was an issue with the food`
              : `How was the food from ${giverName}?`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isReporting ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {rating === 0 && 'Click to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsReporting(true)}
                className="text-destructive hover:text-destructive"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Report Issue
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Describe the issue (e.g., food was spoiled, unsafe, or misleading)"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={4}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsReporting(false)}
              >
                Back to Rating
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Skip
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
