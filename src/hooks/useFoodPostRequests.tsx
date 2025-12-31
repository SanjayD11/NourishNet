import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface FoodPostRequest {
  id: string;
  post_id: string;
  requester_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  message?: string;
  created_at: string;
  updated_at: string;
  requester_profile?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
    phone_number?: string;
  };
  profiles?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
    phone_number?: string;
  };
  food_posts?: {
    food_title: string;
    status?: string;
    best_before?: string;
    hygiene_covered?: boolean;
    hygiene_proper_storage?: boolean;
    hygiene_prepared_today?: boolean;
    hygiene_packed_sealed?: boolean;
    prep_time?: string;
  };
}

export function useFoodPostRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FoodPostRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh function
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Fetch requests for posts owned by current user (incoming)
  const fetchIncomingRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // First get user's post IDs
      const { data: userPosts, error: postsError } = await supabase
        .from('food_posts')
        .select('id')
        .eq('user_id', user.id);

      if (postsError) throw postsError;
      
      if (!userPosts || userPosts.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      const postIds = userPosts.map(p => p.id);

      // Then get requests for those posts - include all relevant statuses
      const { data: requestsData, error: requestsError } = await supabase
        .from('food_post_requests')
        .select('*')
        .in('post_id', postIds)
        .in('status', ['pending', 'accepted', 'declined'])
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Get profiles for requesters
      const requesterIds = [...new Set(requestsData.map(r => r.requester_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, full_name, avatar_url, phone_number')
        .in('user_id', requesterIds);

      if (profilesError) throw profilesError;

      // Get food posts data - include all posts for declined/expired detection
      const { data: foodPosts, error: foodPostsError } = await supabase
        .from('food_posts')
        .select('id, food_title, status, best_before')
        .in('id', postIds);

      if (foodPostsError) throw foodPostsError;

      // Combine data
      const profilesMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      const foodPostsMap = (foodPosts || []).reduce((acc, post) => {
        acc[post.id] = post;
        return acc;
      }, {} as Record<string, any>);

      // For incoming requests, include declined ones for deletion but filter out collected posts for active requests
      const filteredRequests = requestsData.filter(request => {
        const post = foodPostsMap[request.post_id];
        // Keep declined requests regardless of post status (for cleanup)
        if (request.status === 'declined') return true;
        // For pending/accepted, filter out collected posts
        return post && post.status !== 'collected';
      });
      
      const requestsWithData = filteredRequests.map(request => ({
        ...request,
        status: request.status as 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled',
        requester_profile: profilesMap[request.requester_id] || null,
        profiles: profilesMap[request.requester_id] || null, // Keep for backward compatibility
        food_posts: foodPostsMap[request.post_id] || null
      }));

      setRequests(requestsWithData);
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
      toast({
        title: "Error loading requests",
        description: "Failed to load incoming requests. Please refresh.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new request with optimistic update
  const createRequest = async (postId: string, message?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to request food.",
        variant: "destructive"
      });
      return { error: 'Not authenticated' };
    }

    try {
      // Check post status and expiry before creating a request
      const { data: post, error: postError } = await supabase
        .from('food_posts')
        .select('id, status, best_before, user_id')
        .eq('id', postId)
        .maybeSingle();

      if (postError) throw postError;

      if (!post) {
        toast({
          title: "Post not found",
          description: "This food post no longer exists.",
          variant: "destructive",
        });
        return { error: 'Post not found' };
      }

      const now = new Date();
      const isPastBestBefore = post.best_before && new Date(post.best_before) < now;

      if (post.user_id === user.id) {
        toast({
          title: "Not allowed",
          description: "You cannot request your own food.",
          variant: "destructive",
        });
        return { error: 'Cannot request own post' };
      }

      if (post.status === 'expired' || isPastBestBefore) {
        if (post.status !== 'expired' && isPastBestBefore) {
          await supabase
            .from('food_posts')
            .update({ status: 'expired' })
            .eq('id', postId);
        }

        toast({
          title: "Post expired",
          description: "This post has expired and is no longer available.",
          variant: "destructive",
        });
        return { error: 'Post expired' };
      }

      // Prevent duplicate active requests from the same user for this post
      const { data: existingRequest, error: existingError } = await supabase
        .from('food_post_requests')
        .select('id, status')
        .eq('post_id', postId)
        .eq('requester_id', user.id)
        .in('status', ['pending', 'accepted'])
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingRequest) {
        toast({
          title: "Already requested",
          description: "You have already requested this food.",
          variant: "destructive",
        });
        return { error: 'Already requested' };
      }

      // Insert the request
      const { data: newRequest, error } = await supabase
        .from('food_post_requests')
        .insert({
          post_id: postId,
          requester_id: user.id,
          status: 'pending',
          message,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Request sent!",
        description: "Your request has been sent to the food provider. Check your Requests page for updates.",
      });

      // Trigger refresh for real-time sync
      refresh();

      return { error: null, data: newRequest };
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  // Accept a request
  const acceptRequest = async (requestId: string, postId: string) => {
    try {
      // Update request status
      const { error: requestError } = await supabase
        .from('food_post_requests')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Update post status to reserved
      const { error: postError } = await supabase
        .from('food_posts')
        .update({ status: 'reserved' })
        .eq('id', postId);

      if (postError) throw postError;

      // Decline all other pending requests for this post
      await supabase
        .from('food_post_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('post_id', postId)
        .neq('id', requestId)
        .eq('status', 'pending');

      // Update local state immediately
      setRequests(prev => prev.map(r => {
        if (r.id === requestId) {
          return { ...r, status: 'accepted' as const };
        }
        // Decline other pending requests for same post
        if (r.post_id === postId && r.status === 'pending') {
          return { ...r, status: 'declined' as const };
        }
        return r;
      }));

      toast({
        title: "Request accepted!",
        description: "The food item has been reserved. The requester will be notified."
      });

      return { error: null };
    } catch (error) {
      console.error('Error accepting request:', error);
      toast({
        title: "Error",
        description: "Failed to accept request. Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  // Mark a request as completed / collected
  // Updates food_post status to 'collected' with immediate local state update
  // Note: Request status stays 'accepted' due to DB constraint - we track completion via food_post status
  const completeRequest = async (requestId: string, postId: string) => {
    try {
      // Update the food post status to 'collected'
      const { error: postError } = await supabase
        .from('food_posts')
        .update({ status: 'collected' })
        .eq('id', postId);

      if (postError) throw postError;

      // Update request's updated_at to trigger real-time sync
      await supabase
        .from('food_post_requests')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', requestId);

      // Update local state immediately - remove from active incoming requests
      setRequests(prev => prev.filter(r => r.id !== requestId));

      toast({
        title: "✅ Food marked as collected",
        description: "This food has been successfully marked as collected."
      });

      return { error: null };
    } catch (error) {
      console.error('Error completing request:', error);
      toast({
        title: "❌ Failed to mark as collected",
        description: "Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  // Decline a request
  const declineRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('food_post_requests')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state immediately
      setRequests(prev => prev.map(r => 
        r.id === requestId ? { ...r, status: 'declined' as const } : r
      ));

      toast({
        title: "Request declined",
        description: "The request has been declined."
      });

      return { error: null };
    } catch (error) {
      console.error('Error declining request:', error);
      toast({
        title: "Error",
        description: "Failed to decline request. Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  // Delete a request permanently (for expired/declined requests)
  const deleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('food_post_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      // Update local state immediately for instant UI feedback
      setRequests(prev => prev.filter(r => r.id !== requestId));

      toast({
        title: "Request deleted",
        description: "The request has been permanently removed."
      });

      return { error: null };
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request. Please try again.",
        variant: "destructive"
      });
      return { error };
    }
  };

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    fetchIncomingRequests();

    // Subscribe to real-time updates for incoming requests
    const channel = supabase
      .channel(`food_requests_incoming_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'food_post_requests'
      }, (payload) => {
        console.log('Incoming request change detected:', payload);
        fetchIncomingRequests();
      })
      .subscribe((status) => {
        console.log('Incoming requests subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refreshKey, fetchIncomingRequests]);

  return {
    requests,
    loading,
    createRequest,
    acceptRequest,
    declineRequest,
    deleteRequest,
    completeRequest,
    refresh,
  };
}
