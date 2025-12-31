import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface Chat {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  other_user?: {
    id: string;
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    
    // Check if there's a specific chat to open from URL params
    const chatId = searchParams.get('chat');
    if (chatId) {
      setActiveChat(chatId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
      
      // Subscribe to real-time messages for this chat
      const channel = supabase
        .channel(`chat_${activeChat}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${activeChat}`
          },
          (payload) => {
            const newMessage = payload.new as Message;
            setMessages(prev => [...prev, newMessage]);
            scrollToBottom();
            
            // Update chat's last message
            updateChatLastMessage(activeChat, newMessage.content);
            
            // Show browser notification if message is from other user
            if (newMessage.sender_id !== user?.id && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification('New message in FoodConnect', {
                  body: newMessage.content,
                  icon: '/favicon.ico'
                });
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeChat, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          profiles!chats_participant_one_fkey (
            id,
            name,
            full_name,
            avatar_url
          )
        `)
        .or(`participant_one.eq.${user?.id},participant_two.eq.${user?.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Process chats to get the other user's info
      const processedChats = await Promise.all(
        (data || []).map(async (chat) => {
          const otherUserId = chat.participant_one === user?.id 
            ? chat.participant_two 
            : chat.participant_one;

          const { data: otherUser } = await supabase
            .from('profiles')
            .select('id, name, full_name, avatar_url')
            .eq('user_id', otherUserId)
            .single();

          return {
            ...chat,
            other_user: otherUser,
          };
        })
      );

      setChats(processedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles (
            name,
            full_name,
            avatar_url
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const updateChatLastMessage = async (chatId: string, lastMessage: string) => {
    try {
      await supabase
        .from('chats')
        .update({
          last_message: lastMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', chatId);
      
      // Refresh chats to show updated last message
      fetchChats();
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeChat) return;

    setSending(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: activeChat,
          sender_id: user?.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getActiveChat = () => {
    return chats.find(chat => chat.id === activeChat);
  };

  const activeChatData = getActiveChat();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-[calc(100vh-200px)] flex gap-4"
    >
      {/* Chat List */}
      <div className={`${activeChat ? 'hidden md:block' : 'block'} w-full md:w-80 flex-shrink-0`}>
        <Card className="glass-card h-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted animate-pulse rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                      <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : chats.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                <p className="text-muted-foreground text-sm">
                  Start chatting with food providers from the dashboard
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {chats.map((chat) => (
                  <motion.div
                    key={chat.id}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                    className={`p-4 cursor-pointer transition-colors ${
                      activeChat === chat.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setActiveChat(chat.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={chat.other_user?.avatar_url} />
                        <AvatarFallback>
                          {chat.other_user?.name?.[0] || 
                           chat.other_user?.full_name?.[0] || 
                           'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">
                            {chat.other_user?.name || 
                             chat.other_user?.full_name || 
                             'Anonymous'}
                          </p>
                          {chat.last_message_at && (
                            <span className="text-xs text-muted-foreground">
                              {formatMessageTime(chat.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.last_message || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Window */}
      <div className={`${activeChat ? 'block' : 'hidden md:block'} flex-1`}>
        {activeChat && activeChatData ? (
          <Card className="glass-card h-full flex flex-col">
            <CardHeader className="flex-shrink-0 border-b">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden mr-2"
                  onClick={() => setActiveChat(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarImage src={activeChatData.other_user?.avatar_url} />
                  <AvatarFallback>
                    {activeChatData.other_user?.name?.[0] || 
                     activeChatData.other_user?.full_name?.[0] || 
                     'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">
                    {activeChatData.other_user?.name || 
                     activeChatData.other_user?.full_name || 
                     'Anonymous'}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    Food Provider
                  </Badge>
                </div>
              </div>
            </CardHeader>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        message.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'glass-panel'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70 ${
                        message.sender_id === user?.id ? 'text-primary-foreground' : 'text-muted-foreground'
                      }`}>
                        {formatMessageTime(message.created_at)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 border-t p-4">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        ) : (
          <Card className="glass-card h-full">
            <CardContent className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a chat</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}