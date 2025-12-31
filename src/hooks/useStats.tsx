import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppStats {
  communityMembers: number;
  foodItemsShared: number;
  mealsRescued: number;
  requestsFulfilled: number;
}

export function useStats() {
  const [stats, setStats] = useState<AppStats>({
    communityMembers: 0,
    foodItemsShared: 0,
    mealsRescued: 0,
    requestsFulfilled: 0,
  });
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const fetchStats = async () => {
    try {
      // 1. Community Members: Total registered users (profiles count)
      const { count: membersCount, error: membersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (membersError) {
        console.error('Error fetching members count:', membersError);
        throw membersError;
      }

      // 2. Food Items Shared: Count food posts that are reserved (accepted by someone)
      const { count: reservedPostsCount, error: reservedPostsError } = await supabase
        .from('food_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'reserved');

      if (reservedPostsError) {
        console.error('Error fetching reserved posts count:', reservedPostsError);
        throw reservedPostsError;
      }

      // Also count accepted requests
      const { count: acceptedRequestsCount, error: acceptedRequestsError } = await supabase
        .from('food_post_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted');

      if (acceptedRequestsError) {
        console.error('Error fetching accepted requests count:', acceptedRequestsError);
        throw acceptedRequestsError;
      }

      // 3. Meals Rescued: Count food posts marked as 'collected'
      const { count: collectedPostsCount, error: collectedPostsError } = await supabase
        .from('food_posts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'collected');

      if (collectedPostsError) {
        console.error('Error fetching collected posts count:', collectedPostsError);
        throw collectedPostsError;
      }

      // Also count from food_requests table (legacy)
      const { count: completedFoodRequestsCount, error: completedFoodRequestsError } = await supabase
        .from('food_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      if (completedFoodRequestsError) {
        console.error('Error fetching completed food requests count:', completedFoodRequestsError);
      }

      // Calculate totals
      const totalFoodItemsShared = (reservedPostsCount || 0) + (acceptedRequestsCount || 0);
      const totalMealsRescued = (collectedPostsCount || 0) + (completedFoodRequestsCount || 0);
      const totalRequestsFulfilled = totalMealsRescued;

      if (isMounted.current) {
        setStats({
          communityMembers: membersCount || 0,
          foodItemsShared: totalFoodItemsShared,
          mealsRescued: totalMealsRescued,
          requestsFulfilled: totalRequestsFulfilled,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    fetchStats();

    // Subscribe to real-time updates for live stats across all users
    const channel = supabase
      .channel('homepage_stats_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'food_posts'
      }, () => {
        fetchStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'food_post_requests'
      }, () => {
        fetchStats();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'food_requests'
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    stats,
    loading,
    refetch: fetchStats
  };
}
