import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, AlertTriangle, CheckCircle, Loader2, Sparkles, Package, Clock, ThumbsUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  postId: string;
  providerName: string;
  foodTitle?: string;
}

const EXPERIENCE_TAGS = [
  { id: 'fresh_food', label: 'Fresh Food', icon: Sparkles },
  { id: 'clean_packaging', label: 'Clean Packaging', icon: Package },
  { id: 'friendly_provider', label: 'Friendly Provider', icon: ThumbsUp },
  { id: 'on_time_pickup', label: 'On-time Pickup', icon: Clock },
];

export function RatingModal({ open, onOpenChange, providerId, postId, providerName, foodTitle }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const REPORT_REASONS = [
    { id: 'spam', label: 'Spam or misleading' },
    { id: 'fake_post', label: 'Fake food post' },
    { id: 'unsafe_food', label: 'Unsafe or spoiled food' },
    { id: 'abuse', label: 'Abusive behavior' },
    { id: 'other', label: 'Other issue' },
  ];

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a star rating before submitting',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user has already rated this post
      const { data: existingRating } = await supabase
        .from('feedback')
        .select('id')
        .eq('receiver_id', user.id)
        .eq('post_id', postId)
        .eq('is_report', false)
        .single();

      if (existingRating) {
        toast({
          title: 'Already rated',
          description: 'You have already submitted a rating for this food post.',
          variant: 'destructive',
        });
        onOpenChange(false);
        return;
      }

      const { error } = await supabase.from('feedback').insert({
        giver_id: providerId,
        receiver_id: user.id,
        post_id: postId,
        rating: rating,
        report_reason: reviewText || null, // Using report_reason field for review text
        is_report: false,
      });

      if (error) throw error;

      toast({
        title: 'Thank you for your feedback!',
        description: `You rated ${providerName} ${rating} star${rating > 1 ? 's' : ''}.`,
      });

      onOpenChange(false);
      resetForm();
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

  const handleSubmitReport = async () => {
    if (!reportReason) {
      toast({
        title: 'Reason required',
        description: 'Please select a reason for reporting',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('feedback').insert({
        giver_id: providerId,
        receiver_id: user.id,
        post_id: postId,
        rating: null,
        report_reason: `${reportReason}: ${reportDescription}`,
        is_report: true,
      });

      if (error) throw error;

      toast({
        title: 'Report submitted',
        description: 'We will review this report shortly. Thank you for helping keep our community safe.',
      });

      onOpenChange(false);
      resetForm();
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

  const resetForm = () => {
    setRating(0);
    setHoveredRating(0);
    setReviewText('');
    setSelectedTags([]);
    setIsReporting(false);
    setReportReason('');
    setReportDescription('');
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Tap to rate';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReporting ? (
              <>
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Report User
              </>
            ) : (
              <>
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                Rate Your Experience
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isReporting
              ? `Report an issue with ${providerName}`
              : foodTitle
                ? `How was "${foodTitle}" from ${providerName}?`
                : `How was your experience with ${providerName}?`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <AnimatePresence mode="wait">
            {!isReporting ? (
              <motion.div
                key="rating"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Star Rating */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.95 }}
                        className="transition-colors p-1"
                      >
                        <Star
                          className={`w-10 h-10 transition-colors ${
                            star <= (hoveredRating || rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {getRatingLabel(hoveredRating || rating)}
                  </p>
                </div>

                {/* Experience Tags */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">What made it great? (optional)</p>
                  <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_TAGS.map((tag) => {
                      const Icon = tag.icon;
                      const isSelected = selectedTags.includes(tag.id);
                      return (
                        <motion.button
                          key={tag.id}
                          type="button"
                          onClick={() => handleTagToggle(tag.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Badge
                            variant={isSelected ? 'default' : 'outline'}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                            }`}
                          >
                            <Icon className="w-3 h-3 mr-1" />
                            {tag.label}
                          </Badge>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Review Text */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Write a review (optional)</p>
                  <Textarea
                    placeholder="Share your experience with the community..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Report Link */}
                <div className="pt-2 border-t">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsReporting(true)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report an issue instead
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="report"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Report Reasons */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">What went wrong?</p>
                  <div className="grid gap-2">
                    {REPORT_REASONS.map((reason) => (
                      <motion.button
                        key={reason.id}
                        type="button"
                        onClick={() => setReportReason(reason.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          reportReason === reason.id
                            ? 'border-destructive bg-destructive/10 text-destructive'
                            : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <span className="font-medium">{reason.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Report Description */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Additional details (optional)</p>
                  <Textarea
                    placeholder="Describe the issue in detail..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Back to Rating */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReporting(false)}
                >
                  ← Back to rating
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Skip
          </Button>
          <Button
            onClick={isReporting ? handleSubmitReport : handleSubmitRating}
            disabled={submitting || (!isReporting && rating === 0) || (isReporting && !reportReason)}
            className={isReporting ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : isReporting ? (
              'Submit Report'
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Rating
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}