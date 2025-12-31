import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCompletionStatus {
  isComplete: boolean;
  isLoading: boolean;
  missingFields: string[];
  profile: {
    name: string | null;
    location: string | null;
    phone_number: string | null;
    whatsapp_number: string | null;
  } | null;
}

const REQUIRED_FIELDS = ['name', 'location', 'phone_number', 'whatsapp_number'] as const;

export function useProfileCompletion(): ProfileCompletionStatus {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileCompletionStatus['profile']>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, location, phone_number, whatsapp_number')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }

        setProfile(data || null);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const missingFields: string[] = [];
  
  if (profile) {
    if (!profile.name?.trim()) missingFields.push('Name');
    if (!profile.location?.trim()) missingFields.push('Location');
    if (!profile.phone_number?.trim()) missingFields.push('Phone Number');
    if (!profile.whatsapp_number?.trim()) missingFields.push('WhatsApp Number');
  } else if (!isLoading && user) {
    // Profile doesn't exist yet
    missingFields.push('Name', 'Location', 'Phone Number', 'WhatsApp Number');
  }

  return {
    isComplete: missingFields.length === 0,
    isLoading,
    missingFields,
    profile,
  };
}
