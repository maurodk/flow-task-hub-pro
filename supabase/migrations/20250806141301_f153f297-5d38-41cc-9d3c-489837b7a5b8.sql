-- Corrigir política RLS na tabela user_sectors para permitir exclusão de usuários
-- Remover a política existente que bloqueia o service_role
DROP POLICY IF EXISTS "Only admins can delete user sectors" ON public.user_sectors;

-- Criar nova política que permite tanto admins quanto service_role
CREATE POLICY "Only admins can delete user sectors or service role" 
ON public.user_sectors 
FOR DELETE 
USING (is_admin(auth.uid()) OR auth.role() = 'service_role');

-- Verificar e corrigir outras tabelas que podem ter o mesmo problema
-- Tabela user_roles
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
CREATE POLICY "Only admins can delete roles or service role" 
ON public.user_roles 
FOR DELETE 
USING (is_admin(auth.uid()) OR auth.role() = 'service_role');

-- Verificar tabela profiles (já permite service_role por não ter política DELETE restritiva)
-- Não precisa de mudança pois não tem política DELETE específica