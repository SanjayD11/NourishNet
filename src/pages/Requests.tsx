import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, Inbox, Send, Clock, CheckCircle2, XCircle, Package, RefreshCw, Bell, ArrowRight, Phone, MessageCircle, Trash2, AlertTriangle } from 'lucide-react';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useFoodPostRequests, FoodPostRequest } from '@/hooks/useFoodPostRequests';
import { RatingModal } from '@/components/RatingModal';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface OutgoingRequest {
  id: string;
  post_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  food_posts?: {
    food_title: string;
    user_id: string;
    best_before?: string;
    status?: string;
    hygiene_covered?: boolean;
    hygiene_proper_storage?: boolean;
    hygiene_prepared_today?: boolean;
    hygiene_packed_sealed?: boolean;
    prep_time?: string;
  };
  provider_profile?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
    phone_number?: string;
  };
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    variant: 'secondary' as const,
    tooltip: 'Waiting for the provider to respond',
    color: 'text-warning'
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    variant: 'success' as const,
    tooltip: 'Your request has been accepted! Contact the provider to arrange pickup.',
    color: 'text-success'
  },
  declined: {
    label: 'Declined',
    icon: XCircle,
    variant: 'destructive' as const,
    tooltip: 'Unfortunately, this request was declined.',
    color: 'text-destructive'
  },
  completed: {
    label: 'Collected',
    icon: Package,
    variant: 'outline' as const,
    tooltip: 'Food has been collected successfully!',
    color: 'text-muted-foreground'
  },
  collected: {
    label: 'Collected',
    icon: Package,
    variant: 'outline' as const,
    tooltip: 'Food has been collected successfully!',
    color: 'text-success'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    variant: 'destructive' as const,
    tooltip: 'This request was cancelled.',
    color: 'text-destructive'
  },
  expired: {
    label: 'Expired',
    icon: AlertTriangle,
    variant: 'destructive' as const,
    tooltip: 'This request has expired as the food is past its best before date.',
    color: 'text-destructive'
  }
};

// Check if a request is expired based on the food post's best_before date
const isRequestExpired = (bestBefore?: string): boolean => {
  if (!bestBefore) return false;
  return new Date(bestBefore) < new Date();
};

// Get effective status considering expiry
const getEffectiveStatus = (status: string, bestBefore?: string): keyof typeof statusConfig => {
  if (status === 'pending' && isRequestExpired(bestBefore)) {
    return 'expired';
  }
  return status as keyof typeof statusConfig;
};

export default function Requests() {
  const { user } = useAuth();
  const {
    requests: incomingRequests,
    loading: incomingLoading,
    acceptRequest,
    declineRequest,
    deleteRequest: deleteIncomingRequest,
    completeRequest,
    refresh: refreshIncoming,
  } = useFoodPostRequests();

  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([]);
  const [outgoingLoading, setOutgoingLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newRequestCount, setNewRequestCount] = useState(0);
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean;
    giverId: string;
    postId: string;
    giverName: string;
  }>({ open: false, giverId: '', postId: '', giverName: '' });
  const [ratingModal, setRatingModal] = useState<{
    open: boolean;
    providerId: string;
    postId: string;
    providerName: string;
  }>({ open: false, providerId: '', postId: '', providerName: '' });

  // Fetch outgoing requests (requests made by current user)
  const fetchOutgoingRequests = useCallback(async () => {
    if (!user) return;
    try {
      setOutgoingLoading(true);

      const { data: requestsData, error: requestsError } = await supabase
        .from('food_post_requests')
        .select('id, post_id, status, created_at, updated_at')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setOutgoingRequests([]);
        return;
      }

      const postIds = [...new Set(requestsData.map((r) => r.post_id))];
      
      // Get food posts data including status
      const { data: foodPosts, error: foodPostsError } = await supabase
        .from('food_posts')
        .select(
          'id, food_title, user_id, best_before, status'
        )
        .in('id', postIds);

      if (foodPostsError) throw foodPostsError;

      const providerIds = [...new Set(foodPosts?.map((p) => p.user_id) || [])];
      
      // Get provider profiles with phone numbers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, full_name, avatar_url, phone_number')
        .in('user_id', providerIds);

      if (profilesError) throw profilesError;

      const foodPostsMap = (foodPosts || []).reduce((acc, post) => {
        acc[post.id] = post;
        return acc;
      }, {} as Record<string, any>);

      const profilesMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);

      const requestsWithData = requestsData.map((request) => {
        const foodPost = foodPostsMap[request.post_id];
        return {
          ...request,
          status: request.status as OutgoingRequest['status'],
          food_posts: foodPost || null,
          provider_profile: foodPost ? profilesMap[foodPost.user_id] || null : null,
        };
      });

      setOutgoingRequests(requestsWithData);
    } catch (error) {
      console.error('Error fetching outgoing requests:', error);
    } finally {
      setOutgoingLoading(false);
    }
  }, [user]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setNewRequestCount(0);
    await Promise.all([fetchOutgoingRequests(), refreshIncoming()]);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!user?.id) return;

    fetchOutgoingRequests();

    // Subscribe to real-time updates for outgoing requests
    const channel = supabase
      .channel(`food_requests_outgoing_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'food_post_requests',
          filter: `requester_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Outgoing request change detected:', payload);
          fetchOutgoingRequests();
          // Show notification for status changes
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newStatus = (payload.new as any).status;
            if (newStatus === 'accepted') {
              setNewRequestCount(prev => prev + 1);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Outgoing requests subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchOutgoingRequests]);

  const handleAccept = async (request: FoodPostRequest) => {
    setProcessingRequest(request.id);
    try {
      await acceptRequest(request.id, request.post_id);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleDecline = async (request: FoodPostRequest) => {
    setProcessingRequest(request.id);
    try {
      await declineRequest(request.id);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Poster no longer marks collected - just removes the button
  // Keeping handleComplete for backward compatibility but it won't be called from incoming requests
  const handleComplete = async (request: FoodPostRequest) => {
    setProcessingRequest(request.id);
    try {
      await completeRequest(request.id, request.post_id);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Handle requester marking as collected (outgoing requests)
  const handleRequesterComplete = async (request: OutgoingRequest) => {
    if (!request.food_posts?.user_id) return;
    
    setProcessingRequest(request.id);
    try {
      // Update the food post status to 'collected'
      const { error: postError } = await supabase
        .from('food_posts')
        .update({ status: 'collected' })
        .eq('id', request.post_id);

      if (postError) throw postError;

      // Update request status to completed and update timestamp
      const { error: reqError } = await supabase
        .from('food_post_requests')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', request.id);

      if (reqError) {
        console.warn('Could not update request status, but food post is collected');
      }

      // Update local state immediately - mark as collected in history
      setOutgoingRequests(prev => prev.map(r => {
        if (r.id === request.id) {
          return {
            ...r,
            status: 'completed' as const,
            food_posts: r.food_posts ? { ...r.food_posts, status: 'collected' } : undefined
          };
        }
        return r;
      }));

      toast({
        title: "✅ Food marked as collected",
        description: "Thank you! Please rate the food provider."
      });

      // Open rating modal for requester to rate the provider
      setRatingModal({
        open: true,
        providerId: request.food_posts.user_id,
        postId: request.post_id,
        providerName: request.provider_profile?.full_name || request.provider_profile?.name || 'the provider',
      });

      // Also refresh incoming requests to update poster's view
      refreshIncoming();
    } catch (error) {
      console.error('Error marking as collected:', error);
      toast({
        title: "❌ Failed to mark as collected",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  // Contact handlers
  const handleCall = (phoneNumber: string) => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self');
    } else {
      toast({
        title: "Phone not available",
        description: "This user hasn't added their phone number.",
        variant: "destructive"
      });
    }
  };

  const handleWhatsApp = (phoneNumber: string, foodTitle: string) => {
    if (phoneNumber) {
      const message = encodeURIComponent(`Hi! I'm reaching out about the food: "${foodTitle}" on NourishNet.`);
      window.open(`https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    } else {
      toast({
        title: "WhatsApp not available",
        description: "This user hasn't added their phone number.",
        variant: "destructive"
      });
    }
  };

  // Delete request handler - for expired/declined requests (outgoing)
  const handleDeleteOutgoingRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const { error } = await supabase
        .from('food_post_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      // Update local state immediately for instant UI feedback
      setOutgoingRequests(prev => prev.filter(r => r.id !== requestId));

      toast({
        title: "Request deleted",
        description: "The request has been permanently removed."
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Failed to delete",
        description: "Could not delete the request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  // Delete request handler - for expired/declined requests (incoming)
  const handleDeleteIncomingRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await deleteIncomingRequest(requestId);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Safety badges removed - hygiene columns not in current database schema

  const StatusBadge = ({ status }: { status: keyof typeof statusConfig }) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={config.variant} className="flex items-center gap-1 cursor-help">
              <Icon className="w-3 h-3" />
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Filter requests by status - considering expired state
  const pendingIncoming = incomingRequests.filter(r => {
    const effectiveStatus = getEffectiveStatus(r.status, r.food_posts?.best_before);
    return effectiveStatus === 'pending';
  });
  const expiredIncoming = incomingRequests.filter(r => {
    const effectiveStatus = getEffectiveStatus(r.status, r.food_posts?.best_before);
    return effectiveStatus === 'expired';
  });
  const acceptedIncoming = incomingRequests.filter(r => r.status === 'accepted');
  const declinedIncoming = incomingRequests.filter(r => r.status === 'declined');
  
  // Outgoing requests - separate active, expired pending, and history (collected, declined, cancelled)
  const activeOutgoing = outgoingRequests.filter(r => {
    // Skip if already collected/completed
    if (r.status === 'completed' || r.food_posts?.status === 'collected') return false;
    // Accepted requests that are not completed go to active
    if (r.status === 'accepted') return true;
    // Pending requests that haven't expired
    if (r.status === 'pending' && !isRequestExpired(r.food_posts?.best_before)) return true;
    return false;
  });
  
  const expiredOutgoing = outgoingRequests.filter(r => 
    r.status === 'pending' && 
    isRequestExpired(r.food_posts?.best_before) && 
    r.food_posts?.status !== 'collected'
  );
  
  // History includes collected/completed, declined, and cancelled
  const historyOutgoing = outgoingRequests.filter(r => 
    r.status === 'completed' || 
    r.status === 'declined' || 
    r.status === 'cancelled' || 
    r.food_posts?.status === 'collected'
  );

  return (
    <div className="space-y-4 sm:space-y-6 pb-8 px-1 sm:px-0">
      <FeedbackModal
        open={feedbackModal.open}
        onOpenChange={(open) => setFeedbackModal((prev) => ({ ...prev, open }))}
        giverId={feedbackModal.giverId}
        postId={feedbackModal.postId}
        giverName={feedbackModal.giverName}
      />

      <RatingModal
        open={ratingModal.open}
        onOpenChange={(open) => setRatingModal((prev) => ({ ...prev, open }))}
        providerId={ratingModal.providerId}
        postId={ratingModal.postId}
        providerName={ratingModal.providerName}
      />

      {/* Header with refresh button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold truncate">Requests</h1>
          {newRequestCount > 0 && (
            <Badge variant="default" className="animate-pulse flex items-center gap-1 flex-shrink-0">
              <Bell className="w-3 h-3" />
              <span className="hidden sm:inline">{newRequestCount} new</span>
              <span className="sm:hidden">{newRequestCount}</span>
            </Badge>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Incoming Requests Section */}
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-semibold">Incoming Requests</h2>
          {(pendingIncoming.length > 0 || acceptedIncoming.length > 0) && (
            <Badge variant="secondary" className="ml-1 sm:ml-2">
              {pendingIncoming.length + acceptedIncoming.length}
            </Badge>
          )}
        </div>
        
        {incomingLoading ? (
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading incoming requests...</span>
            </CardContent>
          </Card>
        ) : pendingIncoming.length === 0 && acceptedIncoming.length === 0 && expiredIncoming.length === 0 && declinedIncoming.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No incoming requests at the moment</p>
              <p className="text-sm text-muted-foreground mt-1">When someone requests your food, it will appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active pending and accepted requests */}
            {(pendingIncoming.length > 0 || acceptedIncoming.length > 0) && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {[...pendingIncoming, ...acceptedIncoming].map((request: FoodPostRequest) => (
                <motion.div
                  key={request.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="glass-card h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {request.food_posts?.food_title || 'Unknown Food'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={request.requester_profile?.avatar_url} />
                              <AvatarFallback className="text-[10px]">
                                {(request.requester_profile?.name || request.requester_profile?.full_name || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {request.requester_profile?.full_name || request.requester_profile?.name || 'Unknown'}
                            </span>
                          </CardDescription>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {request.status === 'pending' && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  className="flex-1 min-w-[80px]"
                                  disabled={processingRequest === request.id}
                                >
                                  {processingRequest === request.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Accept this request?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will reserve the food for {request.requester_profile?.name || 'this person'} and decline other pending requests for this item.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleAccept(request)}>
                                    Accept Request
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 min-w-[80px]"
                                  disabled={processingRequest === request.id}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Decline
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Decline this request?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to decline this request from {request.requester_profile?.name || 'this person'}?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDecline(request)}>
                                    Decline
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        
                        {request.status === 'accepted' && (
                          <div className="w-full space-y-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleCall(request.requester_profile?.phone_number || '')}
                              >
                                <Phone className="w-4 h-4 mr-1" />
                                Call
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleWhatsApp(
                                  request.requester_profile?.phone_number || '',
                                  request.food_posts?.food_title || 'food item'
                                )}
                              >
                                <MessageCircle className="w-4 h-4 mr-1" />
                                WhatsApp
                              </Button>
                            </div>
                            <p className="text-xs text-success font-medium text-center">
                              ✓ Awaiting collection by requester
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
              </div>
            )}

            {/* Expired incoming requests */}
            {expiredIncoming.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Expired Requests
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {expiredIncoming.map((request: FoodPostRequest) => (
                    <Card key={request.id} className="glass-card opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{request.food_posts?.food_title || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              From: {request.requester_profile?.name || 'Unknown'}
                            </p>
                          </div>
                          <StatusBadge status="expired" />
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full text-destructive hover:text-destructive"
                              disabled={processingRequest === request.id}
                            >
                              {processingRequest === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove this expired request from your history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteIncomingRequest(request.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Declined incoming requests - poster can delete */}
            {declinedIncoming.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Declined Requests
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {declinedIncoming.map((request: FoodPostRequest) => (
                    <Card key={request.id} className="glass-card opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{request.food_posts?.food_title || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              From: {request.requester_profile?.name || 'Unknown'}
                            </p>
                          </div>
                          <StatusBadge status="declined" />
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full text-destructive hover:text-destructive"
                              disabled={processingRequest === request.id}
                            >
                              {processingRequest === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove this declined request from your history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteIncomingRequest(request.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Outgoing Requests Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">My Requests</h2>
          {activeOutgoing.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeOutgoing.length} active
            </Badge>
          )}
        </div>
        
        {outgoingLoading ? (
          <Card className="glass-card">
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Loading your requests...</span>
            </CardContent>
          </Card>
        ) : outgoingRequests.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Send className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">You haven't made any requests yet</p>
              <p className="text-sm text-muted-foreground mt-1">Browse available food and request items you're interested in</p>
              <Button variant="outline" className="mt-4" asChild>
                <a href="/dashboard">
                  Browse Food <ArrowRight className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active requests */}
            {activeOutgoing.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {activeOutgoing.map((request) => (
                    <motion.div
                      key={request.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className={`glass-card h-full hover:shadow-lg transition-shadow ${request.status === 'accepted' ? 'ring-2 ring-success/50' : ''}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">
                                {request.food_posts?.food_title || 'Unknown Food'}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={request.provider_profile?.avatar_url} />
                                  <AvatarFallback className="text-[10px]">
                                    {(request.provider_profile?.name || request.provider_profile?.full_name || 'P').charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">
                                  From: {request.provider_profile?.full_name || request.provider_profile?.name || 'Unknown'}
                                </span>
                              </CardDescription>
                            </div>
                            <StatusBadge status={request.status} />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          <p className="text-xs text-muted-foreground">
                            Requested {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </p>
                          {request.status === 'accepted' && (
                            <>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleCall(request.provider_profile?.phone_number || '')}
                                >
                                  <Phone className="w-4 h-4 mr-1" />
                                  Call
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleWhatsApp(
                                    request.provider_profile?.phone_number || '',
                                    request.food_posts?.food_title || 'food item'
                                  )}
                                >
                                  <MessageCircle className="w-4 h-4 mr-1" />
                                  WhatsApp
                                </Button>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="w-full"
                                    disabled={processingRequest === request.id}
                                  >
                                    {processingRequest === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Package className="w-4 h-4 mr-1" />
                                        Mark as Collected
                                      </>
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Mark as collected?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Confirm that you have collected the food from {request.provider_profile?.name || 'the provider'}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRequesterComplete(request)}>
                                      Confirm Collection
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Expired outgoing requests */}
            {expiredOutgoing.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Expired Requests
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {expiredOutgoing.map((request) => (
                    <Card key={request.id} className="glass-card opacity-75">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{request.food_posts?.food_title || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(request.created_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <StatusBadge status="expired" />
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="w-full text-destructive hover:text-destructive"
                              disabled={processingRequest === request.id}
                            >
                              {processingRequest === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove this expired request from your history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOutgoingRequest(request.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* History with actions for collected and declined requests */}
            {historyOutgoing.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  History
                </h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  {historyOutgoing.slice(0, 12).map((request) => {
                    const isCollected = request.status === 'completed' || request.food_posts?.status === 'collected';
                    const displayStatus = isCollected ? 'collected' : request.status;
                    
                    return (
                      <Card key={request.id} className={`glass-card ${isCollected ? '' : 'opacity-75'}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{request.food_posts?.food_title || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(request.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <StatusBadge status={displayStatus as keyof typeof statusConfig} />
                          </div>
                          
                          {/* Collected items - show rate button */}
                          {isCollected && request.food_posts?.user_id && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => setRatingModal({
                                open: true,
                                providerId: request.food_posts!.user_id,
                                postId: request.post_id,
                                providerName: request.provider_profile?.full_name || request.provider_profile?.name || 'the provider',
                              })}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Rate Provider
                            </Button>
                          )}
                          
                          {/* Declined items - show delete button */}
                          {request.status === 'declined' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="w-full text-destructive hover:text-destructive"
                                  disabled={processingRequest === request.id}
                                >
                                  {processingRequest === request.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Delete
                                    </>
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete this request?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove this declined request from your history.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteOutgoingRequest(request.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}