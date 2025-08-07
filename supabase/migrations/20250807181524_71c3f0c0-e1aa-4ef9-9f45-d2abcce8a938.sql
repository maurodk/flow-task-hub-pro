-- Configurar realtime para as tabelas necessárias
-- Adicionar tabelas à publicação realtime para receber atualizações em tempo real

-- Configurar REPLICA IDENTITY FULL para capturar mudanças completas
ALTER TABLE public.mural_posts REPLICA IDENTITY FULL;
ALTER TABLE public.mural_comments REPLICA IDENTITY FULL;
ALTER TABLE public.activities REPLICA IDENTITY FULL;
ALTER TABLE public.activity_subtasks REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime
-- Primeiro, criar a publicação se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  END IF;
END
$$;

-- Adicionar as tabelas específicas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mural_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mural_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_subtasks;

-- Corrigir política RLS para posts gerais
-- Dropar política existente que está muito restritiva
DROP POLICY IF EXISTS "Users can view posts from accessible chat rooms or sectors" ON public.mural_posts;

-- Criar nova política mais permissiva para posts gerais
CREATE POLICY "Users can view posts from accessible areas" 
ON public.mural_posts 
FOR SELECT 
USING (
  -- Usuários podem ver seus próprios posts
  (user_id = auth.uid()) 
  OR 
  -- Admins podem ver todos os posts
  is_admin(auth.uid())
  OR
  -- Posts gerais (sem setor e sem chat room) são visíveis para todos os usuários autenticados
  (sector_id IS NULL AND chat_room_id IS NULL)
  OR
  -- Posts de chat rooms que o usuário pode acessar
  (chat_room_id IS NOT NULL AND user_can_access_chat_room(chat_room_id, auth.uid()))
  OR
  -- Posts de setores que o usuário pertence
  (sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), sector_id))
);