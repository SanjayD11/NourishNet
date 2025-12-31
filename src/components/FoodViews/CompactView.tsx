import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Clock2, Navigation, Send, CheckCircle, Loader2, Eye } from 'lucide-react';
import ExpiryBadge from '@/components/ExpiryBadge';
import DynamicTranslation from '@/components/DynamicTranslation';

interface FoodPost {
  id: string;
  food_title: string;
  description: string;
  location_lat: number;
  location_long: number;
  location_name?: string;
  food_category?: string;
  cuisine_type?: string;
  tags?: string[];
  status: string;
  created_at: string;
  user_id: string;
  image_url?: string;
  best_before?: string;
  profiles?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
    phone_number?: string;
    whatsapp_number?: string;
  };
  distance?: number;
}

const formatFoodStatus = (status: string) => {
  switch (status) {
    case 'available':
      return 'Available';
    case 'requested':
      return 'Requested';
    case 'reserved':
      return 'Reserved';
    case 'completed':
      return 'Completed';
    case 'expired':
      return 'Expired';
    default:
      return status;
  }
};

interface CompactViewProps {
  posts: FoodPost[];
  onRequestFood: (postId: string) => void;
  onViewDetails: (post: FoodPost) => void;
  userRequests: Record<string, string>;
  requestingPosts: Set<string>;
  formatTimeAgo: (dateString: string) => string;
}

export default function CompactView({
  posts,
  onRequestFood,
  onViewDetails,
  userRequests,
  requestingPosts,
  formatTimeAgo
}: CompactViewProps) {
  return (
    <div className="space-y-2">
      {posts.map((post, index) => {
        const requestStatus = userRequests[post.id];
        const isRequesting = requestingPosts.has(post.id);

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            whileHover={{ x: 4 }}
          >
            <Card className="glass-card overflow-hidden hover:shadow-lg transition-all duration-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Compact avatar / icon only on all viewports to keep layout dense */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 rounded-full overflow-hidden">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.food_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-medium truncate flex-1"><DynamicTranslation text={post.food_title} /></h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="secondary" className="text-[10px] px-2 py-0">
                                  {formatFoodStatus(post.status)}
                                </Badge>
                              </TooltipTrigger>
                              {post.status === 'expired' && (
                                <TooltipContent className="max-w-xs text-xs">
                                  This food has passed its best-before date and is no longer available.
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          <DynamicTranslation text={post.description} />
                        </p>
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock2 className="w-3 h-3" />
                            {formatTimeAgo(post.created_at)}
                          </span>
                          {post.distance && (
                            <span className="flex items-center gap-1">
                              <Navigation className="w-3 h-3" />
                              {post.distance.toFixed(1)} km
                            </span>
                          )}
                          {post.best_before && (
                            <ExpiryBadge bestBefore={post.best_before} showIcon={false} />
                          )}
                          <span className="flex items-center gap-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={post.profiles?.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {post.profiles?.name?.[0] || post.profiles?.full_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-20">
                              {post.profiles?.name || post.profiles?.full_name || 'User'}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Actions - Mobile: full width row, Desktop: inline */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                        {/* Tags - hide on mobile */}
                        <div className="hidden sm:flex gap-1 flex-shrink-0">
                          {post.food_category && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {post.food_category.replace('_', ' ')}
                            </Badge>
                          )}
                          {post.tags && post.tags.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length}
                            </Badge>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetails(post)}
                          className="p-2"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {requestStatus ? (
                          <Button
                            disabled
                            size="sm"
                            className="px-3"
                            variant={requestStatus === 'accepted' ? 'default' : 'secondary'}
                          >
                            {requestStatus === 'pending' ? (
                              <Clock2 className="w-4 h-4" />
                            ) : requestStatus === 'accepted' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <span className="text-xs">✗</span>
                            )}
                          </Button>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                disabled={isRequesting ||
                                  post.status === 'expired' ||
                                  post.status === 'completed' ||
                                  post.status === 'reserved'}
                                size="sm"
                                className="px-3"
                              >
                                {isRequesting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="max-w-sm mx-4">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Request this food?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  You are about to request "{post.food_title}" from {post.profiles?.name || post.profiles?.full_name || 'this provider'}. They will be notified.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onRequestFood(post.id)}>
                                  Confirm
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}