import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, MessageCircle, Calendar, Package, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ProviderRatingDisplay } from '@/components/ProviderRatingDisplay';

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
    location?: string;
    bio?: string;
  };
}

interface ProviderProfileModalProps {
  post: FoodPost | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UserStats {
  totalPosts: number;
  activePosts: number;
  joinedDate: string;
  recentPosts: FoodPost[];
}

export default function ProviderProfileModal({ post, isOpen, onClose }: ProviderProfileModalProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && post) {
      fetchUserStats();
    }
  }, [isOpen, post]);

  const fetchUserStats = async () => {
    if (!post?.user_id) return;
    
    setLoading(true);
    try {
      // Fetch user's food posts
      const { data: userPosts, error: postsError } = await supabase
        .from('food_posts')
        .select('*')
        .eq('user_id', post.user_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (postsError) throw postsError;

      // Fetch user profile for join date
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', post.user_id)
        .single();

      if (profileError) throw profileError;

      const totalPosts = userPosts?.length || 0;
      const activePosts = userPosts?.filter(p => p.status === 'available').length || 0;

      setStats({
        totalPosts,
        activePosts,
        joinedDate: profile?.created_at || new Date().toISOString(),
        recentPosts: userPosts || []
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleWhatsApp = (whatsappNumber: string) => {
    const message = encodeURIComponent(`Hi, I'd like to connect with you through NourishNet!`);
    window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (!post || !isOpen) return null;

  return (
    <AnimatePresence>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="glass-card border-0"
          >
            {/* Header */}
            <DialogHeader className="p-6 pb-0">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={post.profiles?.avatar_url} />
                  <AvatarFallback className="text-2xl">
                    {post.profiles?.name?.[0] || post.profiles?.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold">
                    {post.profiles?.name || post.profiles?.full_name || 'Anonymous User'}
                  </DialogTitle>
                  <div className="flex flex-col gap-2 mt-2">
                    {post.profiles?.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{post.profiles.location}</span>
                      </div>
                    )}
                    {stats && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Member since {format(new Date(stats.joinedDate), 'MMM yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Bio */}
              {post.profiles?.bio && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground leading-relaxed">{post.profiles.bio}</p>
                </motion.div>
              )}

              {/* Stats */}
              {stats && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="font-semibold mb-4">Community Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Card className="glass-panel border-0">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2">
                          <Package className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-2xl font-bold">{stats.totalPosts}</div>
                        <div className="text-sm text-muted-foreground">Total Posts</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="glass-panel border-0">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center w-12 h-12 bg-green-500/10 rounded-full mx-auto mb-2">
                          <Package className="w-6 h-6 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold">{stats.activePosts}</div>
                        <div className="text-sm text-muted-foreground">Active Posts</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Dynamic Rating Display */}
                  <Card className="glass-panel border-0">
                    <CardContent className="p-4">
                      <ProviderRatingDisplay 
                        providerId={post.user_id} 
                        showBreakdown={true} 
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <Card className="glass-panel border-0">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {post.profiles?.phone_number && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>Phone</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCall(post.profiles!.phone_number!)}
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            Call
                          </Button>
                        </div>
                      )}
                      
                      {post.profiles?.whatsapp_number && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MessageCircle className="w-4 h-4 text-muted-foreground" />
                            <span>WhatsApp</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWhatsApp(post.profiles!.whatsapp_number!)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" />
                            Message
                          </Button>
                        </div>
                      )}
                      
                      {!post.profiles?.phone_number && !post.profiles?.whatsapp_number && (
                        <p className="text-muted-foreground text-sm">
                          Contact information not available. Use the request system to connect.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Posts */}
              {stats?.recentPosts && stats.recentPosts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-semibold mb-4">Recent Food Posts</h3>
                  <div className="space-y-3">
                    {stats.recentPosts.slice(0, 3).map((recentPost, index) => (
                      <motion.div
                        key={recentPost.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <Card className="glass-panel border-0">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-muted/50 to-muted rounded-lg flex items-center justify-center flex-shrink-0">
                                {recentPost.image_url ? (
                                  <img
                                    src={recentPost.image_url}
                                    alt={recentPost.food_title}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{recentPost.food_title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {recentPost.description}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant={recentPost.status === 'available' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {recentPost.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTimeAgo(recentPost.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  );
}