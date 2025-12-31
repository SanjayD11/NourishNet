import { supabase } from '@/integrations/supabase/client';

export type FoodPostStatus = 'available' | 'requested' | 'reserved' | 'completed' | 'expired';

export async function updateFoodPostStatus(postId: string, status: FoodPostStatus) {
  try {
    const { error } = await supabase
      .from('food_posts')
      .update({ status })
      .eq('id', postId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating food post status:', error);
  }
}

// Expire posts whose best_before is in the past and cancel their pending/accepted requests
export async function checkAndExpirePosts() {
  try {
    const nowIso = new Date().toISOString();

    const { data: expiredPosts, error: expireError } = await supabase
      .from('food_posts')
      .update({ status: 'expired' })
      .lte('best_before', nowIso)
      .in('status', ['available', 'requested', 'reserved'])
      .select('id');

    if (expireError) throw expireError;

    const expiredIds = (expiredPosts || []).map((p) => p.id);
    if (expiredIds.length === 0) return;

    // Cancel pending/accepted requests for these posts
    const { error: cancelError } = await supabase
      .from('food_post_requests')
      .update({ status: 'cancelled' })
      .in('post_id', expiredIds)
      .in('status', ['pending', 'accepted']);

    if (cancelError) throw cancelError;
  } catch (error) {
    console.error('Error expiring food posts:', error);
  }
}
