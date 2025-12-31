import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Star, AlertTriangle, Users, ShieldAlert, TrendingUp, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserStats {
  user_id: string;
  name: string;
  full_name: string;
  avatar_url: string;
  email: string;
  average_rating: number;
  total_ratings: number;
  negative_reports: number;
  status: string;
}

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserStats[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    bannedUsers: 0,
    totalRatings: 0,
    totalReports: 0,
  });

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error || !data) {
        toast({
          title: 'Access denied',
          description: 'You do not have admin privileges',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchUsers();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, name, full_name, avatar_url, email, average_rating, total_ratings, negative_reports, status')
        .order('negative_reports', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      
      const totalUsers = data?.length || 0;
      const bannedUsers = data?.filter(u => u.status === 'banned').length || 0;
      const totalRatings = data?.reduce((sum, u) => sum + (u.total_ratings || 0), 0) || 0;
      const totalReports = data?.reduce((sum, u) => sum + (u.negative_reports || 0), 0) || 0;

      setStats({ totalUsers, bannedUsers, totalRatings, totalReports });
    } catch (error: any) {
      toast({
        title: 'Error fetching users',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUnban = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('unban_user', { target_user_id: userId });

      if (error) throw error;

      toast({
        title: 'User unbanned',
        description: 'The user has been successfully unbanned',
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Unban failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="glass-card p-6">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, ratings, and reports</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
            <ShieldAlert className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.bannedUsers}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ratings</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRatings}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <BarChart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((userStat) => (
              <div
                key={userStat.user_id}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={userStat.avatar_url} />
                    <AvatarFallback>
                      {(userStat.name || userStat.full_name)?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {userStat.name || userStat.full_name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-muted-foreground">{userStat.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">
                        {userStat.average_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {userStat.total_ratings} ratings
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="font-medium">{userStat.negative_reports}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">reports</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {userStat.status === 'banned' ? (
                      <>
                        <Badge variant="destructive">Banned</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnban(userStat.user_id)}
                        >
                          Unban
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
