import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Settings, Edit3, Trash2, Loader2, Clock, ImageIcon, Navigation, Eye, Lock, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { checkAndExpirePosts } from '@/hooks/useFoodPostLifecycle';

interface FoodPost {
  id: string;
  food_title: string;
  description: string;
  location_lat: number;
  location_long: number;
  status: string;
  created_at: string;
  user_id: string;
  image_url?: string;
  best_before?: string;
  food_category?: string;
  cuisine_type?: string;
  tags?: string[];
  location_name?: string;
}

export default function ManagePosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<FoodPost | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [imageViewOpen, setImageViewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationData, setLocationData] = useState({
    location_name: '',
    location_lat: 0,
    location_long: 0,
  });

  useEffect(() => {
    checkAndExpirePosts();
    fetchUserPosts();
  }, [user]);

  const fetchUserPosts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('food_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your posts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: FoodPost) => {
    setEditingPost(post);
    setLocationData({
      location_name: post.location_name || '',
      location_lat: post.location_lat,
      location_long: post.location_long,
    });
    setEditDialogOpen(true);
  };

  const getCurrentLocation = async () => {
    setGettingLocation(true);
    
    if (!("geolocation" in navigator)) {
      setGettingLocation(false);
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation. Please enter your location manually.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const long = position.coords.longitude;
        
        setLocationData(prev => ({
          ...prev,
          location_lat: lat,
          location_long: long
        }));

        // Try to get a readable address using Nominatim (free, no API key required)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept-Language': 'en',
              }
            }
          );
          const data = await response.json();
          
          if (data.display_name) {
            setLocationData(prev => ({
              ...prev,
              location_name: data.display_name
            }));
          } else {
            setLocationData(prev => ({
              ...prev,
              location_name: `${lat.toFixed(6)}, ${long.toFixed(6)}`
            }));
          }
        } catch (error) {
          // Fallback to coordinates if reverse geocoding fails
          setLocationData(prev => ({
            ...prev,
            location_name: `${lat.toFixed(6)}, ${long.toFixed(6)}`
          }));
          console.error('Error getting location name:', error);
        }
        
        setGettingLocation(false);
        toast({
          title: "Location obtained",
          description: "Your current location has been set for this food post.",
        });
      },
      (error) => {
        setGettingLocation(false);
        
        let errorMessage = "Unable to fetch location. Please try again.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable. Please try again or enter manually.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
        }
        
        toast({
          title: "Location error",
          description: errorMessage,
          variant: "destructive",
        });
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Don't use cached positions for accuracy
      }
    );
  };

  const handleLocationInputChange = (name: string, value: string | number) => {
    setLocationData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingPost) return;

    setSaving(true);

    try {
      // Only update location fields - all other fields remain unchanged
      const { error } = await supabase
        .from('food_posts')
        .update({
          location_name: locationData.location_name,
          location_lat: locationData.location_lat,
          location_long: locationData.location_long,
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      toast({
        title: "Location updated",
        description: "Your food post location has been updated successfully.",
      });

      setEditDialogOpen(false);
      fetchUserPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error updating location",
        description: "There was an error updating your post location. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCategoryLabel = (category?: string) => {
    if (!category) return 'N/A';
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('food_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "Your food post has been deleted successfully.",
      });

      fetchUserPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error deleting post",
        description: "There was an error deleting your post. Please try again.",
        variant: "destructive",
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Manage My Posts</h1>
        </div>
        <p className="text-muted-foreground">
          View, edit, and manage all your food posts
        </p>
      </div>

      {/* Posts Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="glass-card">
                <CardHeader>
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="text-center py-12">
              <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts yet</h3>
              <p className="text-muted-foreground">
                Start sharing food with your community to see your posts here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="glass-card h-full overflow-hidden">
                  {/* Food Image */}
                  <div className="w-full h-48 overflow-hidden">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.food_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{post.food_title}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                          Posted {formatTimeAgo(post.created_at)}
                        </CardDescription>
                      </div>
                      <Badge variant={post.status === 'available' ? 'default' : 'secondary'}>
                        {post.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {post.description}
                    </p>

                    {/* Best Before Display */}
                    {post.best_before && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>Best before {format(new Date(post.best_before), "MMM d, y 'at' h:mm a")}</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => handleEdit(post)}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{post.food_title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(post.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Post Dialog - Location Only */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Edit Food Post
            </DialogTitle>
            <DialogDescription>
              You can only update the location. All other fields are read-only to preserve data integrity.
            </DialogDescription>
          </DialogHeader>

          {editingPost && (
            <TooltipProvider>
              <div className="space-y-6">
                {/* Read-Only: Food Image */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Lock className="w-3 h-3" />
                    Food Image
                  </Label>
                  {editingPost.image_url ? (
                    <div className="relative">
                      <img
                        src={editingPost.image_url}
                        alt={editingPost.food_title}
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-3 right-3"
                        onClick={() => setImageViewOpen(true)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Image
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-32 bg-muted/50 rounded-lg border border-border flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No image available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Read-Only: Food Title */}
                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="flex items-center gap-2 text-muted-foreground cursor-help">
                        <Lock className="w-3 h-3" />
                        Food Title
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Editing disabled for this field</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="px-3 py-2 bg-muted/50 border border-border rounded-md text-foreground">
                    {editingPost.food_title}
                  </div>
                </div>

                {/* Read-Only: Description */}
                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="flex items-center gap-2 text-muted-foreground cursor-help">
                        <Lock className="w-3 h-3" />
                        Description
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Editing disabled for this field</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="px-3 py-2 bg-muted/50 border border-border rounded-md text-foreground min-h-[80px] whitespace-pre-wrap">
                    {editingPost.description}
                  </div>
                </div>

                {/* Read-Only: Category & Cuisine */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className="flex items-center gap-2 text-muted-foreground cursor-help">
                          <Lock className="w-3 h-3" />
                          Food Category
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editing disabled for this field</p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge variant="secondary" className="text-sm px-3 py-1.5">
                      {formatCategoryLabel(editingPost.food_category)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className="flex items-center gap-2 text-muted-foreground cursor-help">
                          <Lock className="w-3 h-3" />
                          Cuisine Type
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editing disabled for this field</p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge variant="secondary" className="text-sm px-3 py-1.5">
                      {formatCategoryLabel(editingPost.cuisine_type)}
                    </Badge>
                  </div>
                </div>

                {/* Read-Only: Tags */}
                {editingPost.tags && editingPost.tags.length > 0 && (
                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className="flex items-center gap-2 text-muted-foreground cursor-help">
                          <Lock className="w-3 h-3" />
                          Tags
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editing disabled for this field</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex flex-wrap gap-2">
                      {editingPost.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Read-Only: Best Before */}
                {editingPost.best_before && (
                  <div className="space-y-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className="flex items-center gap-2 text-muted-foreground cursor-help">
                          <Lock className="w-3 h-3" />
                          Best Before
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editing disabled for this field</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-md text-foreground">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {format(new Date(editingPost.best_before), "PPP 'at' p")}
                    </div>
                  </div>
                )}

                {/* Editable: Location Section */}
                <div className="space-y-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-primary" />
                    <Label className="text-primary font-medium">Location (Editable)</Label>
                  </div>
                  
                  <div className="flex gap-2">
                    <Input
                      value={locationData.location_name}
                      onChange={(e) => handleLocationInputChange('location_name', e.target.value)}
                      placeholder="Enter your location"
                      className="flex-1 bg-background"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      className="whitespace-nowrap"
                    >
                      {gettingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Navigation className="w-4 h-4" />
                      )}
                      <span className="ml-2 hidden sm:inline">
                        {gettingLocation ? 'Getting...' : 'Use Current'}
                      </span>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="edit_lat" className="text-xs text-muted-foreground">Latitude</Label>
                      <Input
                        id="edit_lat"
                        type="number"
                        step="any"
                        value={locationData.location_lat}
                        onChange={(e) => handleLocationInputChange('location_lat', parseFloat(e.target.value) || 0)}
                        placeholder="Latitude"
                        className="text-sm bg-background"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit_long" className="text-xs text-muted-foreground">Longitude</Label>
                      <Input
                        id="edit_long"
                        type="number"
                        step="any"
                        value={locationData.location_long}
                        onChange={(e) => handleLocationInputChange('location_long', parseFloat(e.target.value) || 0)}
                        placeholder="Longitude"
                        className="text-sm bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="flex-1"
                    disabled={saving || !locationData.location_name}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Update Location'
                    )}
                  </Button>
                </div>
              </div>
            </TooltipProvider>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Image View Modal */}
      <Dialog open={imageViewOpen} onOpenChange={setImageViewOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              {editingPost?.food_title}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            {editingPost?.image_url && (
              <img
                src={editingPost.image_url}
                alt={editingPost.food_title}
                className="w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
          <div className="p-4 pt-0 flex justify-end">
            <Button variant="outline" onClick={() => setImageViewOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}