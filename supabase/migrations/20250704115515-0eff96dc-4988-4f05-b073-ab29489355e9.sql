
-- Atualizar a função de trigger para capturar mais tipos de logs
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
    -- Log mudança de status
    IF OLD.status != NEW.status THEN
      INSERT INTO public.activity_logs (
        activity_id, user_id, action_type, sector_id,
        user_name, activity_title
      ) VALUES (
        NEW.id, NEW.user_id, 
        CASE 
          WHEN NEW.status = 'completed' THEN 'completed'
          WHEN NEW.status = 'in_progress' THEN 'updated'
          ELSE 'updated'
        END, 
        NEW.sector_id,
        COALESCE(user_profile_name, 'Usuário'), NEW.title
      );
    END IF;
    
    -- Log mudança de progresso
    IF OLD.progress != NEW.progress THEN
      INSERT INTO public.activity_logs (
        activity_id, user_id, action_type, sector_id,
        user_name, activity_title
      ) VALUES (
        NEW.id, NEW.user_id, 'updated', NEW.sector_id,
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

-- Função para criar log quando subtask é completada
CREATE OR REPLACE FUNCTION public.create_subtask_log()
RETURNS TRIGGER AS $$
DECLARE
  user_profile_name TEXT;
  activity_title_var TEXT;
  activity_sector_id UUID;
BEGIN
  -- Buscar informações da atividade e usuário
  SELECT a.title, a.sector_id, p.name 
  INTO activity_title_var, activity_sector_id, user_profile_name
  FROM public.activities a
  LEFT JOIN public.profiles p ON p.id = auth.uid()
  WHERE a.id = NEW.activity_id;

  -- Log apenas quando subtask é marcada como completa
  IF TG_OP = 'UPDATE' AND OLD.is_completed = false AND NEW.is_completed = true THEN
    INSERT INTO public.activity_logs (
      activity_id, user_id, action_type, sector_id,
      user_name, activity_title
    ) VALUES (
      NEW.activity_id, auth.uid(), 'updated', activity_sector_id,
      COALESCE(user_profile_name, 'Usuário'), 
      COALESCE(activity_title_var, 'Atividade')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para subtasks
CREATE TRIGGER subtask_log_trigger
  AFTER UPDATE ON public.activity_subtasks
  FOR EACH ROW EXECUTE FUNCTION public.create_subtask_log();
