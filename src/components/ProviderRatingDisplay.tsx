import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Shield, Award, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';

interface ProviderRatingDisplayProps {
  providerId: string;
  showBreakdown?: boolean;
  compact?: boolean;
}

interface RatingStats {
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { [key: number]: number };
  completedClaims: number;
  status: string;
}

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  reviewerName: string;
  postTitle?: string;
}

export function ProviderRatingDisplay({ providerId, showBreakdown = false, compact = false }: ProviderRatingDisplayProps) {
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatingData();
  }, [providerId]);

  const fetchRatingData = async () => {
    try {
      // Fetch provider profile with rating stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('average_rating, total_ratings, status')
        .eq('user_id', providerId)
        .single();

      // Fetch rating distribution from feedback
      const { data: feedbackData } = await supabase
        .from('feedback')
        .select('rating')
        .eq('giver_id', providerId)
        .eq('is_report', false)
        .not('rating', 'is', null);

      // Calculate distribution
      const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      feedbackData?.forEach((f: { rating: number | null }) => {
        if (f.rating && f.rating >= 1 && f.rating <= 5) {
          distribution[f.rating]++;
        }
      });

      // Count completed claims
      const { count: completedClaims } = await supabase
        .from('food_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', providerId)
        .eq('status', 'collected');

      setStats({
        averageRating: profile?.average_rating || 0,
        totalRatings: profile?.total_ratings || 0,
        ratingDistribution: distribution,
        completedClaims: completedClaims || 0,
        status: profile?.status || 'active',
      });

      // Fetch recent reviews if breakdown is shown
      if (showBreakdown) {
        const { data: reviewsData } = await supabase
          .from('feedback')
          .select(`
            id,
            rating,
            report_reason,
            created_at,
            receiver_id,
            post_id
          `)
          .eq('giver_id', providerId)
          .eq('is_report', false)
          .not('rating', 'is', null)
          .order('created_at', { ascending: false })
          .limit(5);

        if (reviewsData) {
          // Fetch reviewer names
          const reviewerIds = reviewsData.map((r: any) => r.receiver_id);
          const { data: reviewerProfiles } = await supabase
            .from('profiles')
            .select('user_id, name, full_name')
            .in('user_id', reviewerIds);

          const profileMap = new Map(reviewerProfiles?.map((p: any) => [p.user_id, p.name || p.full_name || 'Anonymous']));

          setReviews(reviewsData.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            reviewText: r.report_reason || '',
            createdAt: r.created_at,
            reviewerName: profileMap.get(r.receiver_id) || 'Anonymous',
          })));
        }
      }
    } catch (error) {
      console.error('Error fetching rating data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrustBadges = () => {
    const badges = [];
    if (stats) {
      if (stats.completedClaims >= 3) {
        badges.push({ id: 'verified', label: 'Verified Provider', icon: Shield, color: 'bg-green-500/10 text-green-600 border-green-200' });
      }
      if (stats.averageRating >= 4.5 && stats.totalRatings >= 5) {
        badges.push({ id: 'top_rated', label: 'Top Rated', icon: Award, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' });
      }
      if (stats.status === 'under_review') {
        badges.push({ id: 'under_review', label: 'Under Review', icon: AlertTriangle, color: 'bg-orange-500/10 text-orange-600 border-orange-200' });
      }
    }
    return badges;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-24" />
      </div>
    );
  }

  if (!stats || stats.totalRatings === 0) {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        <Star className="w-4 h-4 text-muted-foreground" />
        <span className="text-muted-foreground">No ratings yet</span>
      </div>
    );
  }

  const badges = getTrustBadges();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">{stats.averageRating.toFixed(1)}</span>
        </div>
        <span className="text-sm text-muted-foreground">({stats.totalRatings})</span>
        {badges.length > 0 && badges[0] && (() => {
          const IconComponent = badges[0].icon;
          return (
            <Badge variant="outline" className={`text-xs ${badges[0].color}`}>
              <IconComponent className="w-3 h-3 mr-1" />
              {badges[0].label}
            </Badge>
          );
        })()}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Rating Display */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-4xl font-bold">{stats.averageRating.toFixed(1)}</div>
          <div className="flex items-center justify-center gap-0.5 my-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground/30'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.totalRatings} verified rating{stats.totalRatings !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Trust Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge.id} variant="outline" className={badge.color}>
                <badge.icon className="w-3 h-3 mr-1" />
                {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Rating Breakdown */}
      {showBreakdown && (
        <>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium mb-3">Rating Distribution</p>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.ratingDistribution[star] || 0;
              const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm w-8 text-right">{star}★</span>
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-sm w-8 text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Recent Reviews */}
          {reviews.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Verified Community Reviews</p>
                {reviews.map((review) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-muted/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                          <CheckCircle className="w-2 h-2 mr-1" />
                          Verified Claim
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.reviewText && (
                      <p className="text-sm text-muted-foreground">{review.reviewText}</p>
                    )}
                    <p className="text-xs text-muted-foreground">— {review.reviewerName}</p>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}