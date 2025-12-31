import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Clock2, Navigation, Send, CheckCircle, Loader2, Eye, Utensils } from 'lucide-react';
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

interface MosaicViewProps {
  posts: FoodPost[];
  onRequestFood: (postId: string) => void;
  onViewDetails: (post: FoodPost) => void;
  userRequests: Record<string, string>;
  requestingPosts: Set<string>;
  formatTimeAgo: (dateString: string) => string;
}

export default function MosaicView({
  posts,
  onRequestFood,
  onViewDetails,
  userRequests,
  requestingPosts,
  formatTimeAgo
}: MosaicViewProps) {
  const getGridItemClass = (index: number) => {
    // Create dynamic mosaic pattern
    const patterns = [
      'col-span-2 row-span-2', // Large square
      'col-span-1 row-span-1', // Regular
      'col-span-1 row-span-2', // Tall
      'col-span-2 row-span-1', // Wide
      'col-span-1 row-span-1', // Regular
      'col-span-1 row-span-1', // Regular
    ];
    return patterns[index % patterns.length];
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 auto-rows-fr">
      {posts.map((post, index) => {
        const requestStatus = userRequests[post.id];
        const isRequesting = requestingPosts.has(post.id);
        const isLargeCard = index % 6 === 0; // Every 6th item is large

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`glass-card overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer ${
              isLargeCard ? 'sm:col-span-2 sm:row-span-2' : ''
            }`}
            whileHover={{ y: -4, scale: 1.02 }}
            onClick={() => onViewDetails(post)}
          >
            {/* Image Section */}
            <div className={`relative overflow-hidden ${isLargeCard ? 'h-48' : 'h-32'}`}>
              {post.image_url ? (
                <motion.img
                  src={post.image_url}
                  alt={post.food_title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  whileHover={{ scale: 1.1 }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <Utensils className="w-8 h-8 fallback-text" />
                </div>
              )}
              
              {/* Overlay badges */}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                 <TooltipProvider>
                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Badge variant="secondary" className="badge-overlay text-xs hover:bg-black/90">
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
                   <Badge variant="secondary" className="badge-overlay-light text-xs">
                     {post.food_category.replace('_', ' ')}
                   </Badge>
                 )}
               </div>

              {/* Distance badge */}
              {post.distance && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="badge-overlay-light text-xs">
                    <Navigation className="w-3 h-3 mr-1" />
                    {post.distance.toFixed(1)}km
                  </Badge>
                </div>
              )}

              {/* Time overlay */}
              <div className="absolute bottom-2 left-2">
                <div className="badge-overlay text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock2 className="w-3 h-3" />
                  {formatTimeAgo(post.created_at)}
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className={`p-3 space-y-2 ${isLargeCard ? 'p-4 space-y-3' : ''}`}>
              <div className="space-y-1">
                <h3 className={`font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors ${
                  isLargeCard ? 'text-lg' : 'text-sm'
                }`}>
                  <DynamicTranslation text={post.food_title} />
                </h3>
                
                {isLargeCard && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <DynamicTranslation text={post.description} />
                  </p>
                )}
              </div>

              {/* Provider info */}
              <div className="flex items-center gap-2">
                <Avatar className={isLargeCard ? 'w-6 h-6' : 'w-5 h-5'}>
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {post.profiles?.name?.[0] || post.profiles?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate">
                  {post.profiles?.name || post.profiles?.full_name || 'Anonymous'}
                </span>
              </div>

              {/* Location */}
              {post.location_name && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{post.location_name}</span>
                </div>
              )}

              {/* Tags - only show on large cards */}
              {isLargeCard && post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Best before - only show on large cards */}
              {isLargeCard && post.best_before && (
                <ExpiryBadge bestBefore={post.best_before} />
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant={requestStatus === 'accepted' ? 'default' : requestStatus ? 'secondary' : 'default'}
                  size="sm"
                  className={`flex-1 transition-all text-xs ${isLargeCard ? 'h-8' : 'h-7'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestFood(post.id);
                  }}
                  disabled={!!requestStatus || isRequesting}
                >
                  {isRequesting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : requestStatus === 'pending' ? (
                    <Clock2 className="w-3 h-3" />
                  ) : requestStatus === 'accepted' ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  {!isLargeCard ? '' : isRequesting ? 'Requesting...' : requestStatus === 'pending' ? 'Pending' : requestStatus === 'accepted' ? 'Accepted!' : 'Request'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className={`${isLargeCard ? 'h-8 px-3' : 'h-7 px-2'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(post);
                  }}
                >
                  <Eye className="w-3 h-3" />
                  {isLargeCard && <span className="ml-1">View</span>}
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}