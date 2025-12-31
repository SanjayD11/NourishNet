import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFoodPostRequests, FoodPostRequest } from '@/hooks/useFoodPostRequests';
import { format, formatDistanceToNow } from 'date-fns';
import { Check, X, Clock, MessageCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function IncomingRequests() {
  const { requests, loading, acceptRequest, declineRequest } = useFoodPostRequests();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');

  const handleAccept = async (request: FoodPostRequest) => {
    setProcessingId(request.id);
    try {
      await acceptRequest(request.id, request.post_id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (request: FoodPostRequest) => {
    setProcessingId(request.id);
    try {
      await declineRequest(request.id);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Incoming Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allRequests = [...pendingRequests, ...acceptedRequests];

  if (allRequests.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Incoming Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No pending requests at the moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Incoming Requests
            <Badge variant="secondary" className="ml-auto">
              {allRequests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 border rounded-lg bg-card/50 hover:bg-card/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage 
                        src={request.requester_profile?.avatar_url || request.profiles?.avatar_url} 
                        alt={request.requester_profile?.name || request.profiles?.name || 'User'} 
                      />
                      <AvatarFallback>
                        {(request.requester_profile?.name || request.profiles?.name || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-medium text-sm truncate">
                          {request.requester_profile?.full_name || request.requester_profile?.name || request.profiles?.full_name || request.profiles?.name || 'Anonymous'}
                        </p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={request.status === 'pending' ? 'secondary' : 'success'} className="text-xs cursor-help">
                                {request.status === 'pending' ? 'Pending' : 'Accepted'}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{request.status === 'pending' ? 'Waiting for your response' : 'You accepted this request'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        Requesting: <span className="font-medium">{request.food_posts?.food_title || 'Unknown'}</span>
                      </p>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </p>
                      
                      {request.message && (
                        <p className="text-sm text-muted-foreground italic mt-1 truncate">
                          "{request.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto mt-3 sm:mt-0">
                    {request.status === 'pending' && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              className="flex-1 sm:flex-none"
                              disabled={processingId === request.id}
                            >
                              {processingId === request.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-1" />
                                  Accept
                                </>
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Accept this request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will reserve the food for this person and decline other pending requests.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleAccept(request)}>
                                Accept
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 sm:flex-none"
                              disabled={processingId === request.id}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Decline this request?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to decline this request?
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
                      <Badge variant="success" className="text-xs">
                        <Check className="w-3 h-3 mr-1" />
                        Awaiting collection
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
