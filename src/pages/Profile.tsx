import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarUpload } from '@/components/AvatarUpload';
import { Badge } from '@/components/ui/badge';
import { User, Edit3, Save, X, MapPin, Clock, Utensils, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { validateProfile } from '@/utils/validation';
interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  email: string | null;
  phone_number: string | null;
  whatsapp_number: string | null;
}
interface FoodPost {
  id: string;
  food_title: string;
  description: string;
  status: string;
  created_at: string;
}
export default function Profile() {
  const {
    user
  } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [foodPosts, setFoodPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    location: '',
    phone_number: '',
    whatsapp_number: ''
  });
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserFoodPosts();
    }
  }, [user]);
  const fetchProfile = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('profiles').select('*').eq('user_id', user?.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || data.full_name || '',
          bio: data.bio || '',
          location: data.location || '',
          phone_number: data.phone_number || '',
          whatsapp_number: data.whatsapp_number || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleAvatarUpdate = (newAvatarUrl: string) => {
    setProfile(prev => prev ? {
      ...prev,
      avatar_url: newAvatarUrl
    } : null);
  };
  const fetchUserFoodPosts = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('food_posts').select('id, food_title, description, status, created_at').eq('user_id', user?.id).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setFoodPosts(data || []);
    } catch (error) {
      console.error('Error fetching food posts:', error);
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;

    // Validate phone numbers (only numbers, spaces, +, -, parentheses)
    if ((name === 'phone_number' || name === 'whatsapp_number') && value) {
      const phoneRegex = /^[+\-\s\d()]*$/;
      if (!phoneRegex.test(value)) {
        return; // Don't update if invalid characters
      }
    }
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = {
          ...prev
        };
        delete updated[name];
        return updated;
      });
    }
  };
  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: "Error updating profile",
        description: "User not authenticated. Please try again.",
        variant: "destructive"
      });
      return;
    }

    // Use comprehensive validation
    const validation = validateProfile(formData);
    const errors: {
      [key: string]: string;
    } = {};
    Object.entries(validation).forEach(([field, result]) => {
      if (!result.isValid) {
        errors[field] = result.error || 'Invalid field';
      }
    });
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Please fix the errors below",
        description: "Complete all required fields with valid information.",
        variant: "destructive"
      });
      return;
    }
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from('profiles').upsert({
        user_id: user.id,
        name: formData.name,
        full_name: formData.name,
        bio: formData.bio,
        location: formData.location,
        phone_number: formData.phone_number || null,
        whatsapp_number: formData.whatsapp_number || null,
        email: user?.email
      }, {
        onConflict: 'user_id'
      });
      if (error) throw error;
      await fetchProfile();
      setEditing(false);
      setValidationErrors({});
      toast({
        title: "Profile updated successfully! ✅",
        description: "Your profile information has been saved."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  const handlePostStatusUpdate = async (postId: string, newStatus: 'available' | 'taken') => {
    try {
      const {
        error
      } = await supabase.from('food_posts').update({
        status: newStatus
      }).eq('id', postId);
      if (error) throw error;
      setFoodPosts(prev => prev.map(post => post.id === postId ? {
        ...post,
        status: newStatus
      } : post));
      toast({
        title: "Post updated",
        description: `Post marked as ${newStatus}.`
      });
    } catch (error) {
      console.error('Error updating post status:', error);
      toast({
        title: "Error updating post",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  if (loading) {
    return <div className="max-w-4xl mx-auto space-y-6 px-1">
        <Card className="glass-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-20 h-20 bg-muted animate-pulse rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                <div className="h-6 bg-muted animate-pulse rounded w-1/3 mx-auto sm:mx-0" />
                <div className="h-4 bg-muted animate-pulse rounded w-1/2 mx-auto sm:mx-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <motion.div initial={{
    opacity: 0,
    y: 20
  }} animate={{
    opacity: 1,
    y: 0
  }} className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-1">
      {/* Profile Header */}
      <Card className="glass-card">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Avatar and Info Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">

              <AvatarUpload userId={user?.id || ''} currentAvatarUrl={profile?.avatar_url} fallbackText={profile?.name?.[0] || profile?.full_name?.[0] || user?.email?.[0] || 'U'} onAvatarUpdate={handleAvatarUpdate} disabled={loading || saving} />

              <div className="flex-1 space-y-2 w-full text-center sm:text-left">
                {editing ? <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your full name" className={validationErrors.name ? 'border-destructive focus:border-destructive' : ''} />
                      {validationErrors.name && <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{validationErrors.name}</span>
                        </div>}
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Tell us about yourself..." rows={3} />
                    </div>
                    <div>
                      <Label htmlFor="location">Location/Address *</Label>
                      <Input id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="Your detailed address" className={validationErrors.location ? 'border-destructive focus:border-destructive' : ''} required />
                      {validationErrors.location ? <div className="flex items-start gap-2 text-sm text-destructive mt-1 bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>{validationErrors.location}</span>
                        </div> : <p className="text-xs text-muted-foreground mt-1">
                          Include street address, landmarks, or clear directions.
                        </p>}
                    </div>
                    <div>
                      <Label htmlFor="phone_number">Phone Number *</Label>
                      <Input id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder="+91 98765 43210" type="tel" className={validationErrors.phone_number ? 'border-destructive focus:border-destructive' : ''} />
                      {validationErrors.phone_number && <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{validationErrors.phone_number}</span>
                        </div>}
                    </div>
                    <div>
                      <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
                      <Input id="whatsapp_number" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleInputChange} placeholder="91 98765 43210" type="tel" className={validationErrors.whatsapp_number ? 'border-destructive focus:border-destructive' : ''} />
                      {validationErrors.whatsapp_number && <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{validationErrors.whatsapp_number}</span>
                        </div>}
                    </div>
                  </div> : <>
                    <h1 className="text-xl sm:text-2xl font-bold">
                      {profile?.name || profile?.full_name || 'Anonymous User'}
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base break-all">{user?.email}</p>
                    {profile?.bio && <p className="text-foreground text-sm sm:text-base">{profile.bio}</p>}
                    {profile?.location && <div className="flex items-center justify-center sm:justify-start text-muted-foreground text-sm">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="break-words">{profile.location}</span>
                      </div>}
                  </>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:self-start">
              {editing ? <>
                  <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
                setEditing(false);
                setValidationErrors({});
                setFormData({
                  name: profile?.name || profile?.full_name || '',
                  bio: profile?.bio || '',
                  location: profile?.location || '',
                  phone_number: profile?.phone_number || '',
                  whatsapp_number: profile?.whatsapp_number || ''
                });
              }}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </> : <Button onClick={() => setEditing(true)} className="w-full sm:w-auto">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Posts */}
      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl">
            <Utensils className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>My Food Posts ({foodPosts.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {foodPosts.length === 0 ? <div className="text-center py-6 sm:py-8">
              <Utensils className="w-10 sm:w-12 h-10 sm:h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium mb-2">No food posts yet</h3>
              <p className="text-muted-foreground text-sm sm:text-base mb-4">
                Start sharing food with your community
              </p>
              <Button onClick={() => window.location.href = '/post-food'} className="w-full sm:w-auto">
                Share Food
              </Button>
            </div> : <div className="space-y-3 sm:space-y-4">
              {foodPosts.map(post => <motion.div key={post.id} initial={{
            opacity: 0,
            y: 10
          }} animate={{
            opacity: 1,
            y: 0
          }} className="glass-panel p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-medium text-sm sm:text-base truncate">{post.food_title}</h3>
                        <Badge variant={post.status === 'available' ? 'default' : 'secondary'} className="flex-shrink-0">
                          {post.status}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm mb-2 text-green-300 line-clamp-2">
                        {post.description}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        Posted on {formatDate(post.created_at)}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {post.status === 'available' ? <Button size="sm" variant="outline" className="flex-1 sm:flex-initial text-xs sm:text-sm" onClick={() => handlePostStatusUpdate(post.id, 'taken')}>
                          Mark as Taken
                        </Button> : <Button size="sm" variant="outline" className="flex-1 sm:flex-initial text-xs sm:text-sm" onClick={() => handlePostStatusUpdate(post.id, 'available')}>
                          Mark Available
                        </Button>}
                    </div>
                  </div>
                </motion.div>)}
            </div>}
        </CardContent>
      </Card>
    </motion.div>;
}