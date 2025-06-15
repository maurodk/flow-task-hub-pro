
-- Remover TODAS as políticas existentes das tabelas chat_rooms e chat_room_sectors
DROP POLICY IF EXISTS "Users can view chat rooms they have access to" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Creators can update their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Creators can delete their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can delete their own chat rooms" ON public.chat_rooms;

DROP POLICY IF EXISTS "Users can view chat room sectors they have access to" ON public.chat_room_sectors;
DROP POLICY IF EXISTS "Chat room creators can manage sectors" ON public.chat_room_sectors;
DROP POLICY IF EXISTS "Users can view chat room sectors" ON public.chat_room_sectors;
DROP POLICY IF EXISTS "Users can manage chat room sectors" ON public.chat_room_sectors;

-- Recriar apenas as políticas corretas usando as funções de segurança
CREATE POLICY "Users can view accessible chat rooms" 
ON public.chat_rooms 
FOR SELECT 
TO authenticated
USING (
  is_active = true AND 
  public.user_can_access_chat_room(id, auth.uid())
);

CREATE POLICY "Users can create chat rooms" 
ON public.chat_rooms 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.user_can_create_chat_room(auth.uid()) AND
  created_by = auth.uid()
);

CREATE POLICY "Users can update their own chat rooms" 
ON public.chat_rooms 
FOR UPDATE 
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own chat rooms" 
ON public.chat_rooms 
FOR DELETE 
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can view chat room sectors" 
ON public.chat_room_sectors 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr 
    WHERE cr.id = chat_room_id 
    AND cr.is_active = true
    AND public.user_can_access_chat_room(cr.id, auth.uid())
  )
);

CREATE POLICY "Users can manage chat room sectors" 
ON public.chat_room_sectors 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr 
    WHERE cr.id = chat_room_id 
    AND cr.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr 
    WHERE cr.id = chat_room_id 
    AND cr.created_by = auth.uid()
  )
);
