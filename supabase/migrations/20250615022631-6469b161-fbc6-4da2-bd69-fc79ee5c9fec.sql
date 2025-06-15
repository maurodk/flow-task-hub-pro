
-- Remover a política atual de SELECT para chat_rooms
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;

-- Criar nova política de SELECT que permite:
-- 1. Ver chats ativos aos quais o usuário tem acesso
-- 2. Ver próprios chats (mesmo arquivados) se for o criador
CREATE POLICY "Users can view accessible chat rooms" 
ON public.chat_rooms 
FOR SELECT 
TO authenticated
USING (
  (is_active = true AND public.user_can_access_chat_room(id, auth.uid())) 
  OR 
  created_by = auth.uid()
);

-- Atualizar política de SELECT para chat_room_sectors para trabalhar com a nova lógica
DROP POLICY IF EXISTS "Users can view chat room sectors" ON public.chat_room_sectors;

CREATE POLICY "Users can view chat room sectors" 
ON public.chat_room_sectors 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms cr 
    WHERE cr.id = chat_room_id 
    AND (
      (cr.is_active = true AND public.user_can_access_chat_room(cr.id, auth.uid()))
      OR 
      cr.created_by = auth.uid()
    )
  )
);
