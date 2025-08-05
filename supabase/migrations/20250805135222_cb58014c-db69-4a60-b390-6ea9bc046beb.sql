-- Primeiro, limpar dados órfãos antes de alterar constraints
-- Remover notificações de usuários que não existem mais
DELETE FROM public.notifications 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover comentários de usuários que não existem mais
DELETE FROM public.mural_comments 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover likes de usuários que não existem mais
DELETE FROM public.mural_likes 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover posts de usuários que não existem mais
DELETE FROM public.mural_posts 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover atividades de usuários que não existem mais
DELETE FROM public.activities 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover logs de usuários que não existem mais
DELETE FROM public.activity_logs 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover roles de usuários que não existem mais
DELETE FROM public.user_roles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover setores de usuários que não existem mais
DELETE FROM public.user_sectors 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover preferências de usuários que não existem mais
DELETE FROM public.notification_preferences 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover logs de progresso de usuários que não existem mais
DELETE FROM public.activity_progress_logs 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover templates de usuários que não existem mais
DELETE FROM public.user_activity_templates 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Remover eventos de usuários que não existem mais
DELETE FROM public.events 
WHERE created_by NOT IN (SELECT id FROM auth.users);

-- Remover participações de usuários que não existem mais
DELETE FROM public.event_participants 
WHERE user_id NOT IN (SELECT id FROM auth.users) 
   OR invited_by NOT IN (SELECT id FROM auth.users);

-- Remover chat rooms de usuários que não existem mais
DELETE FROM public.chat_rooms 
WHERE created_by NOT IN (SELECT id FROM auth.users);