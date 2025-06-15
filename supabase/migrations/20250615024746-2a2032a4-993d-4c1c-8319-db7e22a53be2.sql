
-- Atualizar a função user_can_access_chat_room para incluir verificações de admin e criador
CREATE OR REPLACE FUNCTION public.user_can_access_chat_room(room_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se o usuário é admin, pode ver todos os chats
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = user_can_access_chat_room.user_id 
    AND role = 'admin'
  ) THEN
    RETURN true;
  END IF;
  
  -- Se o usuário é o criador do chat, pode sempre vê-lo
  IF EXISTS (
    SELECT 1 FROM public.chat_rooms 
    WHERE id = room_id 
    AND created_by = user_can_access_chat_room.user_id
  ) THEN
    RETURN true;
  END IF;
  
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
