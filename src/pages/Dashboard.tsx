import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

import { useFoodPostRequests } from '@/hooks/useFoodPostRequests';
import FoodDetailsModal from '@/components/FoodDetailsModal';
import ProviderProfileModal from '@/components/ProviderProfileModal';
import ViewSwitcher, { ViewType } from '@/components/ViewSwitcher';
import ListView from '@/components/FoodViews/ListView';
import GridView from '@/components/FoodViews/GridView';
import CardView from '@/components/FoodViews/CardView';
import CompactView from '@/components/FoodViews/CompactView';
import MosaicView from '@/components/FoodViews/MosaicView';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';
import { MapPin, Search, Filter, Clock, Navigation, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { checkAndExpirePosts } from '@/hooks/useFoodPostLifecycle';
import { getExpiryInfo } from '@/components/ExpiryBadge';
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

export default function Dashboard() {
  const {
    user
  } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { createRequest } = useFoodPostRequests();
  const [currentView, setCurrentView] = useState<ViewType>('grid');
  
  const [selectedPost, setSelectedPost] = useState<FoodPost | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [foodPosts, setFoodPosts] = useState<FoodPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [userHasPosts, setUserHasPosts] = useState(false);
  const [requestingPosts, setRequestingPosts] = useState<Set<string>>(new Set());
  const [userRequests, setUserRequests] = useState<Record<string, string>>({}); // postId -> requestStatus

  // Filter options
  const foodCategories = ['Veg', 'Non-Veg', 'Vegan', 'Snacks', 'Drinks', 'Others'];
  const cuisineTypes = ['South Indian', 'North Indian', 'Chinese', 'Fast Food', 'Desserts', 'Others'];
  const availableTags = ['Spicy', 'Healthy', 'Homemade', 'Breakfast', 'Lunch', 'Dinner', 'Sweet', 'Savory'];
  useEffect(() => {
    getUserLocation();
    checkAndExpirePosts();
    fetchFoodPosts();
    checkUserPosts();
    fetchUserRequests();

    // Subscribe to real-time updates
    const channel = supabase.channel('food_posts_changes').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'food_posts'
    }, () => {
      fetchFoodPosts();
      checkUserPosts();
    }).on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'food_post_requests'
    }, () => {
      fetchUserRequests();
    }).subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  useEffect(() => {
    let filtered = [...foodPosts];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(post => post.food_title.toLowerCase().includes(searchQuery.toLowerCase()) || post.description.toLowerCase().includes(searchQuery.toLowerCase()) || post.location_name?.toLowerCase().includes(searchQuery.toLowerCase()) || post.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || post.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.food_category === selectedCategory.toLowerCase().replace(/\s+/g, '_'));
    }

    // Apply cuisine filter
    if (selectedCuisine && selectedCuisine !== 'all') {
      filtered = filtered.filter(post => post.cuisine_type === selectedCuisine.toLowerCase().replace(/\s+/g, '_'));
    }

    // Apply tag filter
    if (selectedTag && selectedTag !== 'all') {
      filtered = filtered.filter(post => post.tags?.includes(selectedTag));
    }

    // Apply sorting
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'nearest' && userLocation) {
      filtered.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }
    setFilteredPosts(filtered);
  }, [foodPosts, searchQuery, selectedCategory, selectedCuisine, selectedTag, sortBy, userLocation]);
  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      }, error => {
        console.error('Error getting location:', error);
        toast({
          title: "Location access denied",
          description: "Enable location access to see distances to food posts.",
          variant: "destructive"
        });
      });
    }
  };

  const checkUserPosts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('food_posts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (error) throw error;
      setUserHasPosts((data || []).length > 0);
    } catch (error) {
      console.error('Error checking user posts:', error);
    }
  };

  const fetchUserRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('food_post_requests')
        .select('post_id, status')
        .eq('requester_id', user.id);

      if (error) throw error;

      const requestsMap = (data || []).reduce((acc, request) => {
        acc[request.post_id] = request.status;
        return acc;
      }, {} as Record<string, string>);

      setUserRequests(requestsMap);
    } catch (error) {
      console.error('Error fetching user requests:', error);
    }
  };
  const fetchFoodPosts = async () => {
    try {
      const now = new Date().toISOString();
      
      // Fetch food posts that are available and not expired
      const {
        data: posts,
        error: postsError
      } = await supabase.from('food_posts')
        .select('*')
        .eq('status', 'available')
        .neq('user_id', user?.id)
        .or(`best_before.is.null,best_before.gt.${now}`)
        .order('created_at', {
          ascending: false
        });
      if (postsError) throw postsError;

      // Filter out any posts that slipped through (100+ days old)
      const filteredPosts = (posts || []).filter(post => {
        const createdAt = new Date(post.created_at);
        const daysSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreation < 100;
      });

      // Then get profiles for all unique user_ids
      const userIds = [...new Set(filteredPosts?.map(post => post.user_id) || [])];
      const {
        data: profiles,
        error: profilesError
      } = await supabase.from('profiles').select('user_id, name, full_name, avatar_url, phone_number, whatsapp_number').in('user_id', userIds);
      if (profilesError) throw profilesError;

      // Create a lookup map for profiles
      const profilesMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      // Combine posts with profiles
      const postsWithProfiles = filteredPosts.map(post => ({
        ...post,
        profiles: profilesMap[post.user_id] || null
      }));
      
      const postsWithDistance = postsWithProfiles.map(post => ({
        ...post,
        distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, post.location_lat, post.location_long) : undefined
      }));

      // Sort by expiry urgency first (soon-expiring posts at top), then by distance/date
      const sortedPosts = postsWithDistance.sort((a, b) => {
        const expiryA = getExpiryInfo(a.best_before);
        const expiryB = getExpiryInfo(b.best_before);
        
        // Prioritize soon-expiring posts (critical < warning < safe)
        const urgencyOrder = { critical: 0, warning: 1, safe: 2, expired: 3 };
        const urgencyDiff = urgencyOrder[expiryA.urgency] - urgencyOrder[expiryB.urgency];
        
        if (urgencyDiff !== 0) return urgencyDiff;
        
        // Within same urgency, sort by hours left (ascending)
        if (expiryA.hoursLeft !== expiryB.hoursLeft) {
          return expiryA.hoursLeft - expiryB.hoursLeft;
        }
        
        // Then by distance if available
        if (userLocation && a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        
        // Finally by creation date
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setFoodPosts(sortedPosts);
    } catch (error) {
      console.error('Error fetching food posts:', error);
    } finally {
      setLoading(false);
    }
  };
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  const handleChatClick = async (userId: string, userName: string) => {
    toast({
      title: "Use Request System",
      description: "Click 'Request Food' on the food cards to connect with providers through our requests system.",
    });
  };

  const handleViewDetails = (post: FoodPost) => {
    setSelectedPost(post);
    setShowDetailsModal(true);
  };

  const handleViewProfile = (post: FoodPost) => {
    setSelectedPost(post);
    setShowProfileModal(true);
  };
  const handleRequestFood = async (postId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to request food.",
        variant: "destructive"
      });
      return;
    }

    // Check if already requested
    if (userRequests[postId]) {
      return;
    }

    // Add to requesting set for loading state
    setRequestingPosts(prev => new Set(prev).add(postId));

    try {
      const result = await createRequest(postId);
      
      if (!result.error) {
        // Update local state immediately for instant feedback
        setUserRequests(prev => ({
          ...prev,
          [postId]: 'pending'
        }));
      }
    } finally {
      // Remove from requesting set
      setRequestingPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };
  return <motion.div initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} className="space-y-6">
      {/* Profile Completion Banner */}
      <ProfileCompletionBanner />

      {/* Header */}
      <div className="glass-card p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Food Near You</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Discover available food in your community</p>
            </div>
            
            <div className="flex items-center">
              <ViewSwitcher currentView={currentView} onViewChange={setCurrentView} />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 space-y-3 sm:space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search food, location..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 text-sm sm:text-base" />
          </div>

          {/* Filter Controls */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {foodCategories.map(category => <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, '_')}>
                      {category}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Cuisine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cuisines</SelectItem>
                  {cuisineTypes.map(cuisine => <SelectItem key={cuisine} value={cuisine.toLowerCase().replace(/\s+/g, '_')}>
                      {cuisine}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="w-full sm:w-28">
                  <SelectValue placeholder="Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {availableTags.map(tag => <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Newest
                    </div>
                  </SelectItem>
                  <SelectItem value="nearest">
                    <div className="flex items-center">
                      <Navigation className="w-4 h-4 mr-2" />
                      Nearest
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            {(selectedCategory && selectedCategory !== 'all' || selectedCuisine && selectedCuisine !== 'all' || selectedTag && selectedTag !== 'all' || searchQuery) && <Button variant="outline" onClick={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setSelectedCuisine('all');
            setSelectedTag('all');
          }} className="text-xs w-full sm:w-auto">
                Clear All
              </Button>}
          </div>
        </div>
      </div>


      {/* Content */}
      <div className="min-h-[600px] space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="p-4 sm:p-6">
                    <div className="h-4 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 bg-muted animate-pulse rounded w-2/3 mb-4" />
                    <div className="h-20 bg-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="text-center py-12">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No food posts found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try adjusting your search terms" : "Be the first to share food in your area!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {currentView === 'list' && (
                <ListView
                  posts={filteredPosts}
                  onRequestFood={handleRequestFood}
                  onViewDetails={handleViewDetails}
                  userRequests={userRequests}
                  requestingPosts={requestingPosts}
                  formatTimeAgo={formatTimeAgo}
                />
              )}
              {currentView === 'grid' && (
                <GridView
                  posts={filteredPosts}
                  onRequestFood={handleRequestFood}
                  onViewDetails={handleViewDetails}
                  userRequests={userRequests}
                  requestingPosts={requestingPosts}
                  formatTimeAgo={formatTimeAgo}
                />
              )}
              {currentView === 'card' && (
                <CardView
                  posts={filteredPosts}
                  onRequestFood={handleRequestFood}
                  onViewDetails={handleViewDetails}
                  userRequests={userRequests}
                  requestingPosts={requestingPosts}
                  formatTimeAgo={formatTimeAgo}
                />
              )}
              {currentView === 'compact' && (
                <CompactView
                  posts={filteredPosts}
                  onRequestFood={handleRequestFood}
                  onViewDetails={handleViewDetails}
                  userRequests={userRequests}
                  requestingPosts={requestingPosts}
                  formatTimeAgo={formatTimeAgo}
                />
              )}
            </>
          )}
        </motion.div>
      </div>

      <FoodDetailsModal
        post={selectedPost}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onRequestFood={handleRequestFood}
        onViewProfile={handleViewProfile}
        userRequests={userRequests}
        requestingPosts={requestingPosts}
      />

      <ProviderProfileModal
        post={selectedPost}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </motion.div>;
}
