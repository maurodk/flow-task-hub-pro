
-- Criar tabela para armazenar notificações
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('activity_created', 'activity_updated', 'event_reminder', 'subtask_completed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para preferências de notificação
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  notification_types JSONB DEFAULT '{
    "activity_created": true,
    "activity_updated": true,
    "event_reminder": true,
    "subtask_completed": true
  }'::jsonb,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificações
CREATE POLICY "Users can view own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas RLS para preferências
CREATE POLICY "Users can manage own notification preferences" 
  ON public.notification_preferences 
  FOR ALL 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Função para criar notificação
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  notification_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_preferences JSONB;
BEGIN
  -- Verificar se o usuário tem preferências configuradas
  SELECT notification_types INTO user_preferences
  FROM public.notification_preferences
  WHERE user_id = target_user_id;
  
  -- Se não há preferências ou o tipo está habilitado, criar notificação
  IF user_preferences IS NULL OR (user_preferences ->> notification_type)::boolean IS TRUE THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar sobre criação de atividades
CREATE OR REPLACE FUNCTION public.notify_activity_created()
RETURNS TRIGGER AS $$
DECLARE
  sector_user RECORD;
BEGIN
  -- Notificar todos os usuários do mesmo setor (exceto o criador)
  IF NEW.sector_id IS NOT NULL THEN
    FOR sector_user IN 
      SELECT DISTINCT us.user_id 
      FROM public.user_sectors us 
      WHERE us.sector_id = NEW.sector_id 
      AND us.user_id != NEW.user_id
    LOOP
      PERFORM public.create_notification(
        sector_user.user_id,
        'activity_created',
        'Nova atividade criada',
        'Uma nova atividade "' || NEW.title || '" foi criada no seu setor',
        jsonb_build_object('activity_id', NEW.id, 'activity_title', NEW.title)
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar sobre atualizações de atividades
CREATE OR REPLACE FUNCTION public.notify_activity_updated()
RETURNS TRIGGER AS $$
DECLARE
  sector_user RECORD;
  status_message TEXT;
BEGIN
  -- Apenas notificar sobre mudanças de status significativas
  IF OLD.status != NEW.status AND NEW.status IN ('completed', 'in_progress') THEN
    -- Definir mensagem baseada no novo status
    CASE NEW.status
      WHEN 'completed' THEN
        status_message = 'A atividade "' || NEW.title || '" foi completada';
      WHEN 'in_progress' THEN
        status_message = 'A atividade "' || NEW.title || '" foi iniciada';
      ELSE
        status_message = 'A atividade "' || NEW.title || '" foi atualizada';
    END CASE;
    
    -- Notificar usuários do mesmo setor (exceto quem fez a mudança)
    IF NEW.sector_id IS NOT NULL THEN
      FOR sector_user IN 
        SELECT DISTINCT us.user_id 
        FROM public.user_sectors us 
        WHERE us.sector_id = NEW.sector_id 
        AND us.user_id != NEW.user_id
      LOOP
        PERFORM public.create_notification(
          sector_user.user_id,
          'activity_updated',
          'Atividade atualizada',
          status_message,
          jsonb_build_object('activity_id', NEW.id, 'activity_title', NEW.title, 'new_status', NEW.status)
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar sobre conclusão de subtarefas
CREATE OR REPLACE FUNCTION public.notify_subtask_completed()
RETURNS TRIGGER AS $$
DECLARE
  activity_record RECORD;
  sector_user RECORD;
BEGIN
  -- Apenas notificar quando subtarefa é marcada como concluída
  IF OLD.is_completed = false AND NEW.is_completed = true THEN
    -- Buscar informações da atividade
    SELECT a.title, a.sector_id, a.user_id
    INTO activity_record
    FROM public.activities a
    WHERE a.id = NEW.activity_id;
    
    -- Notificar usuários do mesmo setor
    IF activity_record.sector_id IS NOT NULL THEN
      FOR sector_user IN 
        SELECT DISTINCT us.user_id 
        FROM public.user_sectors us 
        WHERE us.sector_id = activity_record.sector_id
      LOOP
        PERFORM public.create_notification(
          sector_user.user_id,
          'subtask_completed',
          'Subtarefa concluída',
          'A subtarefa "' || NEW.title || '" da atividade "' || activity_record.title || '" foi concluída',
          jsonb_build_object(
            'activity_id', NEW.activity_id, 
            'activity_title', activity_record.title,
            'subtask_id', NEW.id,
            'subtask_title', NEW.title
          )
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar os triggers
CREATE TRIGGER notify_activity_created_trigger
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.notify_activity_created();

CREATE TRIGGER notify_activity_updated_trigger
  AFTER UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.notify_activity_updated();

CREATE TRIGGER notify_subtask_completed_trigger
  AFTER UPDATE ON public.activity_subtasks
  FOR EACH ROW EXECUTE FUNCTION public.notify_subtask_completed();

-- Habilitar realtime para notificações
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
