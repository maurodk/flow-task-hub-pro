-- Corrigir políticas RLS para permitir CASCADE DELETE
-- O problema é que as políticas RLS estão bloqueando operações CASCADE mesmo com service role

-- 1. Alterar política de DELETE para events - permitir service role
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

CREATE POLICY "Users can delete their own events or service role can delete" 
ON public.events 
FOR DELETE 
USING (
  (auth.uid() = created_by) OR 
  (auth.role() = 'service_role')
);

-- 2. Alterar política de DELETE para event_participants - permitir service role  
DROP POLICY IF EXISTS "Event creators can remove participants" ON public.event_participants;

CREATE POLICY "Event creators can remove participants or service role can delete" 
ON public.event_participants 
FOR DELETE 
USING (
  (EXISTS (SELECT 1 FROM events e WHERE e.id = event_participants.event_id AND e.created_by = auth.uid())) OR
  (auth.role() = 'service_role')
);

-- 3. Alterar política de DELETE para chat_rooms - permitir service role
DROP POLICY IF EXISTS "Users can delete their own chat rooms" ON public.chat_rooms;

CREATE POLICY "Users can delete their own chat rooms or service role can delete" 
ON public.chat_rooms 
FOR DELETE 
USING (
  (created_by = auth.uid()) OR 
  (auth.role() = 'service_role')
);

-- 4. Alterar política de DELETE para mural_posts - permitir service role
DROP POLICY IF EXISTS "Users can delete own posts" ON public.mural_posts;

CREATE POLICY "Users can delete own posts or service role can delete" 
ON public.mural_posts 
FOR DELETE 
USING (
  (user_id = auth.uid()) OR 
  (auth.role() = 'service_role')
);

-- 5. Alterar política de DELETE para mural_comments - permitir service role
DROP POLICY IF EXISTS "Users can delete own comments" ON public.mural_comments;

CREATE POLICY "Users can delete own comments or service role can delete" 
ON public.mural_comments 
FOR DELETE 
USING (
  (user_id = auth.uid()) OR 
  (auth.role() = 'service_role')
);

-- 6. Alterar política de DELETE para activities - permitir service role
DROP POLICY IF EXISTS "Users can delete own activities or if admin" ON public.activities;

CREATE POLICY "Users can delete own activities or if admin or service role" 
ON public.activities 
FOR DELETE 
USING (
  (user_id = auth.uid()) OR 
  is_admin(auth.uid()) OR 
  (auth.role() = 'service_role')
);