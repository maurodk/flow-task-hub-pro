
-- Criar função de segurança para verificar se o usuário tem acesso aos chat rooms
CREATE OR REPLACE FUNCTION public.user_can_access_chat_room(room_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se não há setores vinculados ao chat room, é público
  IF NOT EXISTS (
    SELECT 1 FROM public.chat_room_sectors 
    WHERE chat_room_id = room_id
  ) THEN
    RETURN true;
  END IF;
  
  -- Verificar se o usuário pertence a algum setor do chat room
  RETURN EXISTS (
    SELECT 1 
    FROM public.chat_room_sectors crs
    INNER JOIN public.user_sectors us ON crs.sector_id = us.sector_id
    WHERE crs.chat_room_id = room_id 
    AND us.user_id = user_can_access_chat_room.user_id
  );
END;
$$;

-- Criar função para verificar se o usuário pode criar chat rooms
CREATE OR REPLACE FUNCTION public.user_can_create_chat_room(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Por enquanto, todos os usuários autenticados podem criar chat rooms
  RETURN user_id IS NOT NULL;
END;
$$;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can delete their own chat rooms" ON public.chat_rooms;

-- Criar políticas RLS para chat_rooms usando as funções de segurança
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

-- Remover políticas existentes para chat_room_sectors se houver
DROP POLICY IF EXISTS "Users can view chat room sectors" ON public.chat_room_sectors;
DROP POLICY IF EXISTS "Users can manage chat room sectors" ON public.chat_room_sectors;

-- Criar políticas RLS para chat_room_sectors
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

-- Habilitar RLS nas tabelas se ainda não estiver habilitado
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_sectors ENABLE ROW LEVEL SECURITY;
