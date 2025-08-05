-- Corrigir foreign key constraints para permitir CASCADE DELETE
-- Isso resolve o erro "violates foreign key constraint" ao excluir usuários

-- 1. Alterar constraint de mural_posts
ALTER TABLE public.mural_posts 
DROP CONSTRAINT IF EXISTS mural_posts_user_id_fkey;

ALTER TABLE public.mural_posts 
ADD CONSTRAINT mural_posts_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 2. Alterar constraint de mural_comments  
ALTER TABLE public.mural_comments 
DROP CONSTRAINT IF EXISTS mural_comments_user_id_fkey;

ALTER TABLE public.mural_comments 
ADD CONSTRAINT mural_comments_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 3. Alterar constraint de mural_likes
ALTER TABLE public.mural_likes 
DROP CONSTRAINT IF EXISTS mural_likes_user_id_fkey;

ALTER TABLE public.mural_likes 
ADD CONSTRAINT mural_likes_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 4. Alterar constraint de activities
ALTER TABLE public.activities 
DROP CONSTRAINT IF EXISTS activities_user_id_fkey;

ALTER TABLE public.activities 
ADD CONSTRAINT activities_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 5. Alterar constraint de activity_logs
ALTER TABLE public.activity_logs 
DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;

ALTER TABLE public.activity_logs 
ADD CONSTRAINT activity_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 6. Alterar constraint de user_roles
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 7. Alterar constraint de user_sectors
ALTER TABLE public.user_sectors 
DROP CONSTRAINT IF EXISTS user_sectors_user_id_fkey;

ALTER TABLE public.user_sectors 
ADD CONSTRAINT user_sectors_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 8. Alterar constraint de notifications
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 9. Alterar constraint de notification_preferences
ALTER TABLE public.notification_preferences 
DROP CONSTRAINT IF EXISTS notification_preferences_user_id_fkey;

ALTER TABLE public.notification_preferences 
ADD CONSTRAINT notification_preferences_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 10. Alterar constraint de activity_progress_logs
ALTER TABLE public.activity_progress_logs 
DROP CONSTRAINT IF EXISTS activity_progress_logs_user_id_fkey;

ALTER TABLE public.activity_progress_logs 
ADD CONSTRAINT activity_progress_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 11. Alterar constraint de user_activity_templates
ALTER TABLE public.user_activity_templates 
DROP CONSTRAINT IF EXISTS user_activity_templates_user_id_fkey;

ALTER TABLE public.user_activity_templates 
ADD CONSTRAINT user_activity_templates_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 12. Alterar constraints relacionadas a created_by e invited_by
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_created_by_fkey;

ALTER TABLE public.events 
ADD CONSTRAINT events_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.event_participants 
DROP CONSTRAINT IF EXISTS event_participants_user_id_fkey;

ALTER TABLE public.event_participants 
ADD CONSTRAINT event_participants_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.event_participants 
DROP CONSTRAINT IF EXISTS event_participants_invited_by_fkey;

ALTER TABLE public.event_participants 
ADD CONSTRAINT event_participants_invited_by_fkey 
FOREIGN KEY (invited_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

ALTER TABLE public.chat_rooms 
DROP CONSTRAINT IF EXISTS chat_rooms_created_by_fkey;

ALTER TABLE public.chat_rooms 
ADD CONSTRAINT chat_rooms_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;