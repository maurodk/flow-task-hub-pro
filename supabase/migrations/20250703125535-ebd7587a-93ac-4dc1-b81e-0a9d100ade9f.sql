
-- Criar tabela para logs de atividades
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'created', 'completed', 'updated', 'deleted'
  sector_id UUID REFERENCES public.sectors(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_name TEXT,
  activity_title TEXT NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Política para visualizar logs - usuários só veem logs de setores aos quais pertencem
CREATE POLICY "Users can view logs from their sectors" 
  ON public.activity_logs 
  FOR SELECT 
  USING (
    sector_id IS NULL OR 
    user_belongs_to_sector(auth.uid(), sector_id) OR 
    is_admin(auth.uid())
  );

-- Política para inserir logs - qualquer usuário autenticado pode criar logs
CREATE POLICY "Users can create activity logs" 
  ON public.activity_logs 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Função para criar log de atividade automaticamente
CREATE OR REPLACE FUNCTION public.create_activity_log()
RETURNS TRIGGER AS $$
DECLARE
  user_profile_name TEXT;
BEGIN
  -- Buscar nome do usuário
  SELECT name INTO user_profile_name 
  FROM public.profiles 
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  -- Inserir log baseado na operação
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (
      activity_id, user_id, action_type, sector_id, 
      user_name, activity_title
    ) VALUES (
      NEW.id, NEW.user_id, 'created', NEW.sector_id,
      COALESCE(user_profile_name, 'Usuário'), NEW.title
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log apenas se status mudou para completed
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      INSERT INTO public.activity_logs (
        activity_id, user_id, action_type, sector_id,
        user_name, activity_title
      ) VALUES (
        NEW.id, NEW.user_id, 'completed', NEW.sector_id,
        COALESCE(user_profile_name, 'Usuário'), NEW.title
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (
      activity_id, user_id, action_type, sector_id,
      user_name, activity_title
    ) VALUES (
      OLD.id, OLD.user_id, 'deleted', OLD.sector_id,
      COALESCE(user_profile_name, 'Usuário'), OLD.title
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar triggers para capturar mudanças nas atividades
CREATE TRIGGER activity_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.create_activity_log();

-- Habilitar realtime para activity_logs
ALTER TABLE public.activity_logs REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.activity_logs;
