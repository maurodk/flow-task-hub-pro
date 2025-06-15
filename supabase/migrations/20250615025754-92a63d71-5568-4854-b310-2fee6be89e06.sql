
-- Criar tabela para participantes dos eventos
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Política para visualizar participantes (todos podem ver participantes de eventos que podem visualizar)
CREATE POLICY "Anyone can view event participants" 
  ON public.event_participants 
  FOR SELECT 
  USING (true);

-- Política para adicionar participantes (apenas o criador do evento)
CREATE POLICY "Event creators can add participants" 
  ON public.event_participants 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND e.created_by = auth.uid()
    )
  );

-- Política para atualizar participantes (criador do evento ou o próprio participante)
CREATE POLICY "Event creators and participants can update participation" 
  ON public.event_participants 
  FOR UPDATE 
  USING (
    -- Criador do evento pode atualizar
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND e.created_by = auth.uid()
    )
    OR
    -- O próprio participante pode atualizar seu status
    user_id = auth.uid()
  );

-- Política para remover participantes (apenas o criador do evento)
CREATE POLICY "Event creators can remove participants" 
  ON public.event_participants 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND e.created_by = auth.uid()
    )
  );

-- Criar índices para melhor performance
CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON public.event_participants(user_id);

-- Função para atualizar automaticamente o contador de participantes
CREATE OR REPLACE FUNCTION public.update_event_attendees_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o contador baseado no número de participantes confirmados
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.events 
    SET attendees_count = (
      SELECT COUNT(*) 
      FROM public.event_participants 
      WHERE event_id = NEW.event_id 
      AND status = 'confirmed'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.events 
    SET attendees_count = (
      SELECT COUNT(*) 
      FROM public.event_participants 
      WHERE event_id = OLD.event_id 
      AND status = 'confirmed'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar contador automaticamente
CREATE TRIGGER trigger_update_event_attendees_count
  AFTER INSERT OR UPDATE OR DELETE ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.update_event_attendees_count();
