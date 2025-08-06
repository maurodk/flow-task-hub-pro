-- Permitir que admins excluam posts e criar sistema de histórico

-- 1. Atualizar política de DELETE para mural_posts - permitir admins
DROP POLICY IF EXISTS "Users can delete own posts or service role can delete" ON public.mural_posts;

CREATE POLICY "Users can delete own posts, admins can delete any post, or service role can delete" 
ON public.mural_posts 
FOR DELETE 
USING (
  (user_id = auth.uid()) OR 
  is_admin(auth.uid()) OR
  (auth.role() = 'service_role')
);

-- 2. Criar tabela para histórico de ações administrativas
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  target_title TEXT,
  target_user_id UUID,
  target_user_name TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Habilitar RLS na tabela de logs administrativos
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas para admin_action_logs
CREATE POLICY "Only admins can view admin action logs" 
ON public.admin_action_logs 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Only admins can create admin action logs" 
ON public.admin_action_logs 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()) AND admin_user_id = auth.uid());

-- 5. Criar função para registrar ações administrativas
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action_type TEXT,
  p_target_type TEXT,
  p_target_id UUID,
  p_target_title TEXT DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL,
  p_target_user_name TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  log_id UUID;
  admin_profile_name TEXT;
BEGIN
  -- Verificar se o usuário é admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can log administrative actions';
  END IF;
  
  -- Buscar nome do admin
  SELECT name INTO admin_profile_name 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Inserir log
  INSERT INTO public.admin_action_logs (
    admin_user_id, action_type, target_type, target_id,
    target_title, target_user_id, target_user_name, details
  ) VALUES (
    auth.uid(), p_action_type, p_target_type, p_target_id,
    p_target_title, p_target_user_id, p_target_user_name, 
    p_details || jsonb_build_object('admin_name', COALESCE(admin_profile_name, 'Admin'))
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;