import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MapPin, Clock, Navigation, Phone, MessageCircle, User, Calendar, Tag, ExternalLink, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import FoodImageCarousel from '@/components/FoodImageCarousel';
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
  hygiene_covered?: boolean;
  hygiene_proper_storage?: boolean;
  hygiene_prepared_today?: boolean;
  hygiene_packed_sealed?: boolean;
  prep_time?: string;
  profiles?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
    phone_number?: string;
    whatsapp_number?: string;
    location?: string;
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

interface FoodDetailsModalProps {
  post: FoodPost | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestFood: (postId: string) => void;
  onViewProfile: (post: FoodPost) => void;
  userRequests: Record<string, string>;
  requestingPosts: Set<string>;
}

export default function FoodDetailsModal({
  post,
  isOpen,
  onClose,
  onRequestFood,
  onViewProfile,
  userRequests,
  requestingPosts
}: FoodDetailsModalProps) {
  if (!post) return null;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${post.location_lat},${post.location_long}`;
    window.open(url, '_blank');
  };

  const handleCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleWhatsApp = (whatsappNumber: string) => {
    const message = encodeURIComponent(`Hi, I'm interested in your food post: ${post.food_title}`);
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const requestStatus = userRequests[post.id];
  const isRequesting = requestingPosts.has(post.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-3xl lg:max-w-6xl max-h-[95vh] overflow-y-auto p-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="glass-card border-0"
            >
              {/* Header */}
              <DialogHeader className="p-4 sm:p-6 pb-0 border-b border-border/50">
                <div className="flex flex-col gap-3">
                  <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold break-words">
                    <DynamicTranslation text={post.food_title} />
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Posted {formatTimeAgo(post.created_at)}</span>
                    </div>
                    {post.distance && (
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        <span>{post.distance.toFixed(1)} km away</span>
                      </div>
                    )}
                    {post.best_before && (
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Best before {format(new Date(post.best_before), 'PPP')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </DialogHeader>

              {/* Main Content */}
              <div className="flex flex-col lg:flex-row min-h-[0]">
                {/* Left Column - Food Details */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex-1 p-6 space-y-6 lg:border-r lg:border-border/30"
                >
                  {/* Food Images Carousel */}
                  <div className="relative">
                    <FoodImageCarousel
                      images={post.images}
                      fallbackImage={post.image_url}
                      title={post.food_title}
                    />
                    
                    {/* Floating Status Badge */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="secondary" className="absolute top-4 left-4 badge-overlay hover:bg-black/90">
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

                  {/* Food Description */}
                  <Card className="glass-panel border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Tag className="w-5 h-5" />
                        About this food
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        <DynamicTranslation text={post.description} />
                      </p>
                    </CardContent>
                  </Card>

                  {/* Tags and Categories */}
                  {(post.food_category || post.cuisine_type || (post.tags && post.tags.length > 0)) && (
                    <Card className="glass-panel border-0">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {(post.food_category || post.cuisine_type) && (
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                Categories
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {post.food_category && (
                                  <Badge variant="secondary" className="capitalize">
                                    {post.food_category.replace('_', ' ')}
                                  </Badge>
                                )}
                                {post.cuisine_type && (
                                  <Badge variant="outline" className="capitalize">
                                    {post.cuisine_type.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {post.tags && post.tags.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3">Tags</h4>
                              <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>

                {/* Right Column - Location & Provider */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full lg:w-96 p-6 bg-gradient-to-b from-muted/20 to-muted/40 backdrop-blur-sm space-y-6"
                >
                  {/* Pickup Location */}
                  <Card className="glass-panel border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <MapPin className="w-5 h-5 text-primary" />
                        Pickup Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground leading-tight">
                                {post.location_name || 'Pickup location available'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 font-mono">
                                Coordinates: {post.location_lat.toFixed(4)}, {post.location_long.toFixed(4)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                📍 Please confirm pickup details with the provider
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          onClick={handleGetDirections}
                          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                          size="lg"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Get Directions
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                      </motion.div>
                      
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">
                          🗺️ Opens in Google Maps
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Fastest route to pickup location
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Provider Information - Enhanced */}
                  <Card className="glass-panel border-0 shadow-lg">
                    <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        Food Provider
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-4">
                      {/* Provider Profile Section */}
                      <motion.div 
                        className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-background/80 to-accent/20 border border-border/30"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Avatar className="w-16 h-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                          <AvatarImage src={post.profiles?.avatar_url} />
                          <AvatarFallback className="text-lg bg-gradient-to-br from-primary/20 to-primary/30 text-primary font-semibold">
                            {post.profiles?.name?.[0] || post.profiles?.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-foreground">
                            {post.profiles?.name || post.profiles?.full_name || 'Anonymous User'}
                          </h3>
                          {post.profiles?.location && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3 text-primary/60" />
                              <span className="truncate">{post.profiles.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              ⭐ Trusted Provider
                            </Badge>
                          </div>
                        </div>
                      </motion.div>

                      <Separator />

                      {/* Contact Options - Enhanced */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-3 h-3 text-green-600" />
                          </div>
                          <h4 className="font-semibold text-foreground">Contact Options</h4>
                        </div>
                        
                        {(post.profiles?.phone_number || post.profiles?.whatsapp_number) ? (
                          <div className="grid gap-3">
                            {post.profiles?.phone_number && (
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                  variant="outline"
                                  onClick={() => handleCall(post.profiles!.phone_number!)}
                                  className="w-full justify-start h-auto p-4 bg-gradient-to-r from-blue-50/50 to-blue-100/50 border-blue-200/50 hover:from-blue-100/50 hover:to-blue-150/50 hover:border-blue-300/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                                      <Phone className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="text-left">
                                      <div className="font-medium text-blue-700">Call Provider</div>
                                      <div className="text-sm text-blue-600">{post.profiles.phone_number}</div>
                                    </div>
                                  </div>
                                </Button>
                              </motion.div>
                            )}
                            {post.profiles?.whatsapp_number && (
                              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button
                                  variant="outline"
                                  onClick={() => handleWhatsApp(post.profiles!.whatsapp_number!)}
                                  className="w-full justify-start h-auto p-4 bg-gradient-to-r from-green-50/50 to-green-100/50 border-green-200/50 hover:from-green-100/50 hover:to-green-150/50 hover:border-green-300/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                                      <MessageCircle className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div className="text-left">
                                      <div className="font-medium text-green-700">WhatsApp Message</div>
                                      <div className="text-sm text-green-600">{post.profiles.whatsapp_number}</div>
                                    </div>
                                  </div>
                                </Button>
                              </motion.div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-gradient-to-r from-amber-50/50 to-orange-50/50 border border-amber-200/50 p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-amber-800 mb-1">
                                  Direct contact not available
                                </p>
                                <p className="text-xs text-amber-700">
                                  Use the request system below to connect with the provider safely.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Button
                          variant="ghost"
                          onClick={() => onViewProfile(post)}
                          className="w-full mt-4 border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all duration-300 h-auto min-h-12 py-2 px-3 flex-wrap gap-1"
                        >
                          <span className="flex items-center gap-1.5 shrink-0">
                            <User className="w-4 h-4 shrink-0" />
                            <span className="text-sm">View Full Profile</span>
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Stats • Posts • Reviews</span>
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 pt-0 border-t border-border/50 bg-muted/20"
              >
                <Button
                  onClick={() => onRequestFood(post.id)}
                  disabled={!!requestStatus ||
                    isRequesting ||
                    post.status === 'expired' ||
                    post.status === 'completed' ||
                    post.status === 'reserved'}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                  variant={requestStatus === 'accepted' ? 'default' : requestStatus ? 'secondary' : 'default'}
                >
                  {post.status === 'expired' ? (
                    'Expired – not available'
                  ) : isRequesting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        <Clock className="w-5 h-5" />
                      </motion.div>
                      Requesting...
                    </>
                  ) : requestStatus === 'pending' ? (
                    <>
                      <Clock className="w-5 h-5 mr-2" />
                      Request Sent
                    </>
                  ) : requestStatus === 'accepted' ? (
                    <>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <MapPin className="w-5 h-5 mr-2" />
                      </motion.div>
                      Request Accepted!
                    </>
                  ) : requestStatus === 'declined' ? (
                    'Request Declined'
                  ) : (
                    <>
                      <Navigation className="w-5 h-5 mr-2" />
                      Request Food
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center mt-3">
                  By requesting this food, you agree to pick it up at the specified location and time.
                  <br />
                  <span className="text-primary/80">Contact options available via provider profile.</span>
                </p>
              </motion.div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}