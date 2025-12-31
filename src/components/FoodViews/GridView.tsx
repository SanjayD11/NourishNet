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
import { useLanguage } from '@/providers/LanguageProvider';

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

interface GridViewProps {
  posts: FoodPost[];
  onRequestFood: (postId: string) => void;
  onViewDetails: (post: FoodPost) => void;
  userRequests: Record<string, string>;
  requestingPosts: Set<string>;
  formatTimeAgo: (dateString: string) => string;
}

export default function GridView({
  posts,
  onRequestFood,
  onViewDetails,
  userRequests,
  requestingPosts,
  formatTimeAgo
}: GridViewProps) {
  const { t } = useLanguage();
  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, index) => {
        const requestStatus = userRequests[post.id];
        const isRequesting = requestingPosts.has(post.id);

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            whileHover={{ 
              y: -8, 
              scale: 1.03,
              transition: { type: "spring", stiffness: 400, damping: 20 }
            }}
            className="h-full"
          >
            <Card className="glass-card h-full overflow-hidden group hover:shadow-lg transition-all duration-300 border-0">
              {/* Food Image */}
              <div className="relative w-full h-40 sm:h-48 overflow-hidden">
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.food_title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No image available</p>
                    </div>
                  </div>
                )}
                
                 {/* Status and Distance Badges */}
                 <div className="absolute top-3 left-3 right-3 flex justify-between">
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
                  {post.distance && (
                    <Badge variant="outline" className="badge-overlay-light">
                      {post.distance.toFixed(1)} km
                    </Badge>
                  )}
                </div>

                {/* Best Before Badge */}
                {post.best_before && (
                  <div className="absolute bottom-3 left-3 right-3">
                    <ExpiryBadge bestBefore={post.best_before} className="w-full justify-center" />
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-1">
                      <DynamicTranslation text={post.food_title} />
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock2 className="w-3 h-3" />
                        {formatTimeAgo(post.created_at)}
                      </span>
                    </CardDescription>
                  </div>
                </div>

                {/* Provider Info */}
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={post.profiles?.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {post.profiles?.name?.[0] || post.profiles?.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground truncate">
                    {post.profiles?.name || post.profiles?.full_name || 'Anonymous User'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  <DynamicTranslation text={post.description} />
                </p>

                {/* Tags */}
                {(post.food_category || post.cuisine_type || (post.tags && post.tags.length > 0)) && (
                  <div className="flex flex-wrap gap-1">
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
                    {post.tags?.slice(0, 1).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {post.tags && post.tags.length > 1 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.tags.length - 1}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Location */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{post.location_name || 'Location provided by owner'}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(post)}
                    className="flex-1 w-full sm:w-auto"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
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
                          <Clock2 className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Pending</span>
                        </>
                      ) : requestStatus === 'accepted' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Accepted</span>
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
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-1" />
                              <span className="hidden sm:inline">Request</span>
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
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}