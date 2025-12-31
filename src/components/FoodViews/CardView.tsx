import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Clock2, Navigation, Send, CheckCircle, Loader2, Eye, Phone, MessageCircle } from 'lucide-react';
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

interface CardViewProps {
  posts: FoodPost[];
  onRequestFood: (postId: string) => void;
  onViewDetails: (post: FoodPost) => void;
  userRequests: Record<string, string>;
  requestingPosts: Set<string>;
  formatTimeAgo: (dateString: string) => string;
}

export default function CardView({
  posts,
  onRequestFood,
  onViewDetails,
  userRequests,
  requestingPosts,
  formatTimeAgo
}: CardViewProps) {
  return (
    <div className="grid gap-4 sm:gap-8 grid-cols-1 md:grid-cols-2">
      {posts.map((post, index) => {
        const requestStatus = userRequests[post.id];
        const isRequesting = requestingPosts.has(post.id);

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.1,
              type: "spring",
              stiffness: 150,
              damping: 20
            }}
            whileHover={{ 
              y: -10, 
              scale: 1.02,
              transition: { type: "spring", stiffness: 300, damping: 15 }
            }}
          >
            <Card className="glass-card overflow-hidden group hover:shadow-xl transition-all duration-300 border-0">
              {/* Large Food Image */}
              <div className="relative w-full h-48 sm:h-64 overflow-hidden">
                {post.image_url ? (
                  <img
                    src={post.image_url}
                    alt={post.food_title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 fallback-text mx-auto mb-3" />
                      <p className="fallback-text font-medium">No image available</p>
                    </div>
                  </div>
                )}
                
                {/* Floating Badges */}
                <div className="absolute top-4 left-4 right-4 flex justify-between">
                  <div className="flex gap-2 flex-wrap">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="badge-overlay hover:bg-black/90">
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
                    {post.food_category && (
                      <Badge variant="secondary" className="badge-overlay-light capitalize">
                        {post.food_category.replace('_', ' ')}
                      </Badge>
                    )}
                    <ExpiryBadge bestBefore={post.best_before} className="badge-overlay-light" />
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {post.distance && (
                      <Badge variant="outline" className="badge-overlay-light">
                        <Navigation className="w-3 h-3 mr-1" />
                        {post.distance.toFixed(1)} km
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 gradient-overlay-bottom" />
                
                {/* Title Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-overlay text-xl font-bold mb-2 line-clamp-2"><DynamicTranslation text={post.food_title} /></h3>
                  <div className="flex items-center gap-3 text-overlay-subtle text-sm">
                    <span className="flex items-center gap-1">
                      <Clock2 className="w-4 h-4" />
                      {formatTimeAgo(post.created_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {post.location_name || 'Pickup location'}
                    </span>
                  </div>
                </div>
              </div>

              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Provider Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.profiles?.avatar_url} />
                      <AvatarFallback>
                        {post.profiles?.name?.[0] || post.profiles?.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {post.profiles?.name || post.profiles?.full_name || 'Anonymous User'}
                      </p>
                      <p className="text-sm text-muted-foreground">Food Provider</p>
                    </div>
                  </div>
                  
                </div>

                {/* Description */}
                <div>
                  <p className="text-muted-foreground line-clamp-3 leading-relaxed"><DynamicTranslation text={post.description} /></p>
                </div>

                {/* Tags */}
                {((post.cuisine_type) || (post.tags && post.tags.length > 0)) && (
                  <div className="flex flex-wrap gap-2">
                    {post.cuisine_type && (
                      <Badge variant="secondary" className="capitalize">
                        {post.cuisine_type.replace('_', ' ')}
                      </Badge>
                    )}
                    {post.tags?.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    {post.tags && post.tags.length > 3 && (
                      <Badge variant="outline">
                        +{post.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => onViewDetails(post)}
                    className="flex-1 w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  
                  {requestStatus ? (
                    <Button
                      disabled
                      className="flex-1 w-full"
                      variant={requestStatus === 'accepted' ? 'default' : 'secondary'}
                    >
                      {requestStatus === 'pending' ? (
                        <>
                          <Clock2 className="w-4 h-4 mr-2" />
                          Request Sent
                        </>
                      ) : requestStatus === 'accepted' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accepted!
                        </>
                      ) : (
                        'Request Declined'
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
                          className="flex-1 w-full"
                        >
                          {isRequesting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Requesting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Request Food
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