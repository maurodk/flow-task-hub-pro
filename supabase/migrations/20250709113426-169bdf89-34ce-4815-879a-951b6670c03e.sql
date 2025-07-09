
-- Alterar a foreign key constraint para permitir ON DELETE SET NULL
ALTER TABLE public.activity_logs 
DROP CONSTRAINT IF EXISTS activity_logs_activity_id_fkey;

-- Recriar a constraint com ON DELETE SET NULL
ALTER TABLE public.activity_logs 
ADD CONSTRAINT activity_logs_activity_id_fkey 
FOREIGN KEY (activity_id) 
REFERENCES public.activities(id) 
ON DELETE SET NULL;

-- Atualizar a função de log para lidar com atividades excluídas
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
    -- Criar log de exclusão ANTES da atividade ser removida
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
