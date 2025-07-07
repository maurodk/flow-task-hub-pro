
-- Adicionar colunas para detalhes específicos dos logs
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS details TEXT,
ADD COLUMN IF NOT EXISTS subtask_title TEXT;

-- Atualizar a função de log de subtarefas para ser mais específica
CREATE OR REPLACE FUNCTION public.create_subtask_log()
RETURNS TRIGGER AS $$
DECLARE
  user_profile_name TEXT;
  activity_title_var TEXT;
  activity_sector_id UUID;
  action_details TEXT;
BEGIN
  -- Buscar informações da atividade e usuário
  SELECT a.title, a.sector_id, p.name 
  INTO activity_title_var, activity_sector_id, user_profile_name
  FROM public.activities a
  LEFT JOIN public.profiles p ON p.id = auth.uid()
  WHERE a.id = NEW.activity_id;

  -- Log mudanças de status da subtarefa
  IF TG_OP = 'UPDATE' AND OLD.is_completed != NEW.is_completed THEN
    -- Definir detalhes da ação
    IF NEW.is_completed = true THEN
      action_details = 'marcou como concluída a subtarefa';
    ELSE
      action_details = 'desmarcou como concluída a subtarefa';
    END IF;

    INSERT INTO public.activity_logs (
      activity_id, user_id, action_type, sector_id,
      user_name, activity_title, details, subtask_title
    ) VALUES (
      NEW.activity_id, auth.uid(), 'updated', activity_sector_id,
      COALESCE(user_profile_name, 'Usuário'), 
      COALESCE(activity_title_var, 'Atividade'),
      action_details,
      NEW.title
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Melhorar a função de log de atividades para capturar mais detalhes
CREATE OR REPLACE FUNCTION public.create_activity_log()
RETURNS TRIGGER AS $$
DECLARE
  user_profile_name TEXT;
  action_details TEXT;
BEGIN
  -- Buscar nome do usuário
  SELECT name INTO user_profile_name 
  FROM public.profiles 
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  -- Inserir log baseado na operação
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (
      activity_id, user_id, action_type, sector_id, 
      user_name, activity_title, details
    ) VALUES (
      NEW.id, NEW.user_id, 'created', NEW.sector_id,
      COALESCE(user_profile_name, 'Usuário'), NEW.title,
      'criou a atividade'
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Log mudança de status com detalhes
    IF OLD.status != NEW.status THEN
      CASE 
        WHEN NEW.status = 'completed' THEN
          action_details = 'completou a atividade';
        WHEN NEW.status = 'in_progress' AND OLD.status = 'pending' THEN
          action_details = 'iniciou a atividade';
        WHEN NEW.status = 'pending' AND OLD.status = 'in_progress' THEN
          action_details = 'pausou a atividade';
        ELSE
          action_details = 'atualizou o status da atividade';
      END CASE;

      INSERT INTO public.activity_logs (
        activity_id, user_id, action_type, sector_id,
        user_name, activity_title, details
      ) VALUES (
        NEW.id, NEW.user_id, 
        CASE 
          WHEN NEW.status = 'completed' THEN 'completed'
          ELSE 'updated'
        END, 
        NEW.sector_id,
        COALESCE(user_profile_name, 'Usuário'), NEW.title,
        action_details
      );
    END IF;
    
    -- Log mudança de progresso (apenas se não foi por mudança de status)
    IF OLD.progress != NEW.progress AND OLD.status = NEW.status THEN
      INSERT INTO public.activity_logs (
        activity_id, user_id, action_type, sector_id,
        user_name, activity_title, details
      ) VALUES (
        NEW.id, NEW.user_id, 'updated', NEW.sector_id,
        COALESCE(user_profile_name, 'Usuário'), NEW.title,
        CONCAT('atualizou o progresso de ', OLD.progress, '% para ', NEW.progress, '%')
      );
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.activity_logs (
      activity_id, user_id, action_type, sector_id,
      user_name, activity_title, details
    ) VALUES (
      OLD.id, OLD.user_id, 'deleted', OLD.sector_id,
      COALESCE(user_profile_name, 'Usuário'), OLD.title,
      'excluiu a atividade'
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
