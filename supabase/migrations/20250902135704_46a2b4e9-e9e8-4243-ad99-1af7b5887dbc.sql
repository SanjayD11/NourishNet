-- Add foreign key constraint between food_posts and profiles
ALTER TABLE public.food_posts 
ADD CONSTRAINT food_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key constraint between chats and profiles  
ALTER TABLE public.chats 
ADD CONSTRAINT chats_participant_one_fkey 
FOREIGN KEY (participant_one) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.chats 
ADD CONSTRAINT chats_participant_two_fkey 
FOREIGN KEY (participant_two) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Add foreign key constraint between messages and profiles
ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;