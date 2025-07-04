
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
