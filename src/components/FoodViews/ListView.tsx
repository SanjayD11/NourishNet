import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  images?: string[];
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

interface ListViewProps {
  posts: FoodPost[];
  onRequestFood: (postId: string) => void;
  onViewDetails: (post: FoodPost) => void;
  userRequests: Record<string, string>;
  requestingPosts: Set<string>;
  formatTimeAgo: (dateString: string) => string;
}

export default function ListView({
  posts,
  onRequestFood,
  onViewDetails,
  userRequests,
  requestingPosts,
  formatTimeAgo
}: ListViewProps) {
  return (
    <div className="space-y-4">
      {posts.map((post, index) => {
        const requestStatus = userRequests[post.id];
        const isRequesting = requestingPosts.has(post.id);

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -2 }}
          >
            <Card className="glass-card overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Image Section */}
                <div className="w-full sm:w-48 h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.food_title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center min-h-[150px]">
                      <MapPin className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                     <TooltipProvider>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <Badge variant="secondary" className="badge-overlay-light">
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
                </div>

                {/* Content Section */}
                <div className="flex-1 p-4 sm:p-6">
                  <div className="flex flex-col h-full">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg sm:text-xl mb-1"><DynamicTranslation text={post.food_title} /></CardTitle>
                          <CardDescription className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                            <span className="flex items-center gap-1">
                              <Clock2 className="w-3 sm:w-4 h-3 sm:h-4" />
                              {formatTimeAgo(post.created_at)}
                            </span>
                            {post.distance && (
                              <span className="flex items-center gap-1">
                                <Navigation className="w-3 sm:w-4 h-3 sm:h-4" />
                                {post.distance.toFixed(1)} km
                              </span>
                            )}
                            {post.best_before && (
                              <ExpiryBadge bestBefore={post.best_before} />
                            )}
                          </CardDescription>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground line-clamp-2"><DynamicTranslation text={post.description} /></p>

                      {/* Tags */}
                      {(post.food_category || post.cuisine_type || (post.tags && post.tags.length > 0)) && (
                        <div className="flex flex-wrap gap-2">
                          {post.food_category && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {post.food_category.replace('_', ' ')}
                            </Badge>
                          )}
                          {post.cuisine_type && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {post.cuisine_type.replace('_', ' ')}
                            </Badge>
                          )}
                          {post.tags?.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {post.tags && post.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{post.tags.length - 2} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{post.location_name || 'Location provided by owner'}</span>
                      </div>

                      {/* Provider */}
                      <div className="flex items-center gap-2 text-sm">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={post.profiles?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {post.profiles?.name?.[0] || post.profiles?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">
                          by {post.profiles?.name || post.profiles?.full_name || 'Anonymous User'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(post)}
                        className="flex-1 w-full sm:w-auto"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      
                      {requestStatus ? (
                        <Button
                          disabled
                          size="sm"
                          className="flex-1 w-full sm:w-auto"
                          variant={requestStatus === 'accepted' ? 'default' : 'secondary'}
                        >
                          {requestStatus === 'pending' ? (
                            <>
                              <Clock2 className="w-4 h-4 mr-2" />
                              Pending
                            </>
                          ) : requestStatus === 'accepted' ? (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accepted!
                            </>
                          ) : (
                            'Declined'
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
                              className="flex-1 w-full sm:w-auto"
                            >
                              {isRequesting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Requesting...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Request
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-sm mx-4">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Request this food?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You are about to request "{post.food_title}" from {post.profiles?.name || post.profiles?.full_name || 'this provider'}. They will be notified of your request.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onRequestFood(post.id)}>
                                Confirm Request
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}