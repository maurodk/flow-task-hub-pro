
-- Criar tabela para salas de chat customizadas
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Criar tabela para vincular salas de chat aos setores
CREATE TABLE public.chat_room_sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(chat_room_id, sector_id)
);

-- Adicionar coluna chat_room_id na tabela mural_posts para vincular posts a chats específicos
ALTER TABLE public.mural_posts ADD COLUMN chat_room_id UUID REFERENCES public.chat_rooms(id) ON DELETE SET NULL;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_room_sectors ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_rooms
CREATE POLICY "Users can view chat rooms they have access to" 
  ON public.chat_rooms 
  FOR SELECT 
  USING (
    -- Criador pode ver
    created_by = auth.uid() 
    OR 
    -- Ou usuário pertence a pelo menos um setor da sala
    EXISTS (
      SELECT 1 FROM public.chat_room_sectors crs
      INNER JOIN public.user_sectors us ON crs.sector_id = us.sector_id
      WHERE crs.chat_room_id = chat_rooms.id AND us.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create chat rooms" 
  ON public.chat_rooms 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their chat rooms" 
  ON public.chat_rooms 
  FOR UPDATE 
  USING (created_by = auth.uid());

CREATE POLICY "Creators can delete their chat rooms" 
  ON public.chat_rooms 
  FOR DELETE 
  USING (created_by = auth.uid());

-- Políticas RLS para chat_room_sectors
CREATE POLICY "Users can view chat room sectors they have access to" 
  ON public.chat_room_sectors 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = chat_room_sectors.chat_room_id
      AND (
        cr.created_by = auth.uid()
        OR 
        EXISTS (
          SELECT 1 FROM public.user_sectors us 
          WHERE us.sector_id = chat_room_sectors.sector_id AND us.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Chat room creators can manage sectors" 
  ON public.chat_room_sectors 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = chat_room_sectors.chat_room_id AND cr.created_by = auth.uid()
    )
  );
