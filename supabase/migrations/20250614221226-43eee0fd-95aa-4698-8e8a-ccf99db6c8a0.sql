
-- Criar tabela para eventos
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  attendees_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Política para visualizar eventos (todos podem ver)
CREATE POLICY "Anyone can view events" 
  ON public.events 
  FOR SELECT 
  USING (true);

-- Política para criar eventos (usuários autenticados)
CREATE POLICY "Authenticated users can create events" 
  ON public.events 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Política para atualizar eventos (apenas o criador)
CREATE POLICY "Users can update their own events" 
  ON public.events 
  FOR UPDATE 
  USING (auth.uid() = created_by);

-- Política para deletar eventos (apenas o criador)
CREATE POLICY "Users can delete their own events" 
  ON public.events 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Criar índices para melhor performance
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_created_by ON public.events(created_by);
