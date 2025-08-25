-- RECONSTRUÇÃO COMPLETA DAS POLÍTICAS RLS
-- Remove todas as políticas existentes e cria novas simplificadas

-- =================================================================
-- 1. LIMPEZA COMPLETA - REMOVER TODAS AS POLÍTICAS EXISTENTES
-- =================================================================

-- Profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.profiles;

-- User Roles
DROP POLICY IF EXISTS "Only admins can delete roles or service role" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- User Sectors
DROP POLICY IF EXISTS "Only admins can delete user sectors or service role" ON public.user_sectors;
DROP POLICY IF EXISTS "Only admins can manage user sectors" ON public.user_sectors;
DROP POLICY IF EXISTS "Only admins can update user sectors" ON public.user_sectors;
DROP POLICY IF EXISTS "Users can view own sectors" ON public.user_sectors;

-- Sectors
DROP POLICY IF EXISTS "Only admins can delete sectors" ON public.sectors;
DROP POLICY IF EXISTS "Only admins can manage sectors" ON public.sectors;
DROP POLICY IF EXISTS "Only admins can update sectors" ON public.sectors;
DROP POLICY IF EXISTS "Users can view sectors" ON public.sectors;

-- Activities
DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete own activities or if admin or service role" ON public.activities;
DROP POLICY IF EXISTS "Users can update own activities or sector activities if admin" ON public.activities;
DROP POLICY IF EXISTS "Users can view activities from their sectors or own" ON public.activities;

-- Activity Subtasks
DROP POLICY IF EXISTS "Users can manage subtasks of own activities" ON public.activity_subtasks;
DROP POLICY IF EXISTS "Users can view subtasks of accessible activities" ON public.activity_subtasks;

-- Activity Logs
DROP POLICY IF EXISTS "Users can create activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Users can view logs from their sectors" ON public.activity_logs;

-- Activity Progress Logs
DROP POLICY IF EXISTS "Users can create progress logs for accessible activities" ON public.activity_progress_logs;
DROP POLICY IF EXISTS "Users can view progress logs of accessible activities" ON public.activity_progress_logs;

-- User Activity Templates
DROP POLICY IF EXISTS "Users can manage own templates" ON public.user_activity_templates;
DROP POLICY IF EXISTS "Users can view own templates" ON public.user_activity_templates;

-- User Template Subtasks
DROP POLICY IF EXISTS "Users can manage subtasks of own templates" ON public.user_template_subtasks;
DROP POLICY IF EXISTS "Users can view subtasks of own templates" ON public.user_template_subtasks;

-- Activity Templates
DROP POLICY IF EXISTS "Only admins can manage activity templates" ON public.activity_templates;
DROP POLICY IF EXISTS "Users can view activity templates" ON public.activity_templates;

-- Activity Template Subtasks
DROP POLICY IF EXISTS "Only admins can manage template subtasks" ON public.activity_template_subtasks;
DROP POLICY IF EXISTS "Users can view template subtasks" ON public.activity_template_subtasks;

-- Mural Posts
DROP POLICY IF EXISTS "Users can create posts" ON public.mural_posts;
DROP POLICY IF EXISTS "Users can delete own posts, admins can delete any post, or serv" ON public.mural_posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.mural_posts;
DROP POLICY IF EXISTS "Users can view posts from accessible areas" ON public.mural_posts;

-- Mural Comments
DROP POLICY IF EXISTS "Users can create comments on accessible posts" ON public.mural_comments;
DROP POLICY IF EXISTS "Users can delete own comments or service role can delete" ON public.mural_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.mural_comments;
DROP POLICY IF EXISTS "Users can view comments from accessible posts" ON public.mural_comments;

-- Mural Likes
DROP POLICY IF EXISTS "Users can manage own likes on accessible posts" ON public.mural_likes;
DROP POLICY IF EXISTS "Users can view likes from accessible posts" ON public.mural_likes;

-- Chat Rooms
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can delete their own chat rooms or service role can delet" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update their own chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view accessible chat rooms" ON public.chat_rooms;

-- Chat Room Sectors
DROP POLICY IF EXISTS "Users can manage chat room sectors" ON public.chat_room_sectors;
DROP POLICY IF EXISTS "Users can view chat room sectors" ON public.chat_room_sectors;

-- Events
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events or service role can delete" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;

-- Event Participants
DROP POLICY IF EXISTS "Anyone can view event participants" ON public.event_participants;
DROP POLICY IF EXISTS "Event creators and participants can update participation" ON public.event_participants;
DROP POLICY IF EXISTS "Event creators can add participants" ON public.event_participants;
DROP POLICY IF EXISTS "Event creators can remove participants or service role can dele" ON public.event_participants;

-- Notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

-- Notification Preferences
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;

-- Admin Action Logs
DROP POLICY IF EXISTS "Only admins can create admin action logs" ON public.admin_action_logs;
DROP POLICY IF EXISTS "Only admins can view admin action logs" ON public.admin_action_logs;

-- System Settings
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Users can view system settings" ON public.system_settings;

-- =================================================================
-- 2. NOVAS POLÍTICAS SIMPLIFICADAS
-- =================================================================

-- ------------------------------
-- SISTEMA DE USUÁRIOS E ROLES
-- ------------------------------

-- Profiles: Próprio + Admin pode ver todos
CREATE POLICY "view_profiles" ON public.profiles
FOR SELECT USING (
  id = auth.uid() OR is_admin(auth.uid())
);

CREATE POLICY "update_own_profile" ON public.profiles
FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- User Roles: Admin gerencia, próprio visualiza
CREATE POLICY "view_user_roles" ON public.user_roles
FOR SELECT USING (
  user_id = auth.uid() OR is_admin(auth.uid())
);

CREATE POLICY "admin_manage_user_roles" ON public.user_roles
FOR ALL USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- User Sectors: Admin gerencia, próprio visualiza
CREATE POLICY "view_user_sectors" ON public.user_sectors
FOR SELECT USING (
  user_id = auth.uid() OR is_admin(auth.uid())
);

CREATE POLICY "admin_manage_user_sectors" ON public.user_sectors
FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_update_user_sectors" ON public.user_sectors
FOR UPDATE USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admin_delete_user_sectors" ON public.user_sectors
FOR DELETE USING (is_admin(auth.uid()));

-- ------------------------------
-- SISTEMA DE SETORES
-- ------------------------------

-- Sectors: Público para visualização, Admin gerencia
CREATE POLICY "view_sectors" ON public.sectors
FOR SELECT USING (true);

CREATE POLICY "admin_manage_sectors" ON public.sectors
FOR ALL USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ------------------------------
-- SISTEMA DE ATIVIDADES
-- ------------------------------

-- Activities: Próprio + Setor + Admin
CREATE POLICY "view_activities" ON public.activities
FOR SELECT USING (
  user_id = auth.uid() OR 
  is_admin(auth.uid()) OR
  (sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), sector_id))
);

CREATE POLICY "create_activities" ON public.activities
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_activities" ON public.activities
FOR UPDATE USING (
  user_id = auth.uid() OR is_admin(auth.uid())
) WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_activities" ON public.activities
FOR DELETE USING (
  user_id = auth.uid() OR is_admin(auth.uid())
);

-- Activity Subtasks: Segue permissões da atividade pai
CREATE POLICY "view_activity_subtasks" ON public.activity_subtasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM activities a 
    WHERE a.id = activity_id AND (
      a.user_id = auth.uid() OR 
      is_admin(auth.uid()) OR
      (a.sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), a.sector_id))
    )
  )
);

CREATE POLICY "manage_activity_subtasks" ON public.activity_subtasks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM activities a 
    WHERE a.id = activity_id AND (
      a.user_id = auth.uid() OR is_admin(auth.uid())
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM activities a 
    WHERE a.id = activity_id AND a.user_id = auth.uid()
  )
);

-- Activity Logs: Baseado no setor da atividade
CREATE POLICY "view_activity_logs" ON public.activity_logs
FOR SELECT USING (
  sector_id IS NULL OR 
  user_belongs_to_sector(auth.uid(), sector_id) OR 
  is_admin(auth.uid())
);

CREATE POLICY "create_activity_logs" ON public.activity_logs
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Activity Progress Logs: Baseado no setor da atividade
CREATE POLICY "view_activity_progress_logs" ON public.activity_progress_logs
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM activities a 
    WHERE a.id = activity_id AND (
      a.user_id = auth.uid() OR 
      is_admin(auth.uid()) OR
      (a.sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), a.sector_id))
    )
  )
);

CREATE POLICY "create_activity_progress_logs" ON public.activity_progress_logs
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM activities a 
    WHERE a.id = activity_id AND (
      a.user_id = auth.uid() OR 
      is_admin(auth.uid()) OR
      (a.sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), a.sector_id))
    )
  )
);

-- User Activity Templates: Próprio + Admin visualiza
CREATE POLICY "view_user_activity_templates" ON public.user_activity_templates
FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "manage_user_activity_templates" ON public.user_activity_templates
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- User Template Subtasks: Segue template pai
CREATE POLICY "view_user_template_subtasks" ON public.user_template_subtasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_activity_templates t 
    WHERE t.id = template_id AND (
      t.user_id = auth.uid() OR is_admin(auth.uid())
    )
  )
);

CREATE POLICY "manage_user_template_subtasks" ON public.user_template_subtasks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_activity_templates t 
    WHERE t.id = template_id AND t.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_activity_templates t 
    WHERE t.id = template_id AND t.user_id = auth.uid()
  )
);

-- Activity Templates: Público visualiza, Admin gerencia
CREATE POLICY "view_activity_templates" ON public.activity_templates
FOR SELECT USING (true);

CREATE POLICY "admin_manage_activity_templates" ON public.activity_templates
FOR ALL USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Activity Template Subtasks: Público visualiza, Admin gerencia
CREATE POLICY "view_activity_template_subtasks" ON public.activity_template_subtasks
FOR SELECT USING (true);

CREATE POLICY "admin_manage_activity_template_subtasks" ON public.activity_template_subtasks
FOR ALL USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- ------------------------------
-- SISTEMA DE MURAL E CHAT
-- ------------------------------

-- Mural Posts: Posts gerais são PÚBLICOS, posts de setor/chat seguem regras específicas
CREATE POLICY "view_mural_posts" ON public.mural_posts
FOR SELECT USING (
  -- Posts gerais (sem setor nem chat) são públicos
  (sector_id IS NULL AND chat_room_id IS NULL) OR
  -- Posts próprios sempre visíveis 
  user_id = auth.uid() OR
  -- Admin vê tudo
  is_admin(auth.uid()) OR
  -- Posts de setor para usuários do setor
  (sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), sector_id)) OR
  -- Posts de chat room para usuários com acesso
  (chat_room_id IS NOT NULL AND user_can_access_chat_room(chat_room_id, auth.uid()))
);

CREATE POLICY "create_mural_posts" ON public.mural_posts
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_mural_posts" ON public.mural_posts
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_mural_posts" ON public.mural_posts
FOR DELETE USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Mural Comments: Segue permissões do post pai
CREATE POLICY "view_mural_comments" ON public.mural_comments
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM mural_posts mp 
    WHERE mp.id = post_id AND (
      -- Posts gerais são públicos
      (mp.sector_id IS NULL AND mp.chat_room_id IS NULL) OR
      mp.user_id = auth.uid() OR
      is_admin(auth.uid()) OR
      (mp.sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), mp.sector_id)) OR
      (mp.chat_room_id IS NOT NULL AND user_can_access_chat_room(mp.chat_room_id, auth.uid()))
    )
  )
);

CREATE POLICY "create_mural_comments" ON public.mural_comments
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM mural_posts mp 
    WHERE mp.id = post_id AND (
      (mp.sector_id IS NULL AND mp.chat_room_id IS NULL) OR
      mp.user_id = auth.uid() OR
      is_admin(auth.uid()) OR
      (mp.sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), mp.sector_id)) OR
      (mp.chat_room_id IS NOT NULL AND user_can_access_chat_room(mp.chat_room_id, auth.uid()))
    )
  )
);

CREATE POLICY "update_mural_comments" ON public.mural_comments
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete_mural_comments" ON public.mural_comments
FOR DELETE USING (user_id = auth.uid());

-- Mural Likes: Segue permissões do post pai
CREATE POLICY "view_mural_likes" ON public.mural_likes
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM mural_posts mp 
    WHERE mp.id = post_id AND (
      (mp.sector_id IS NULL AND mp.chat_room_id IS NULL) OR
      mp.user_id = auth.uid() OR
      is_admin(auth.uid()) OR
      (mp.sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), mp.sector_id)) OR
      (mp.chat_room_id IS NOT NULL AND user_can_access_chat_room(mp.chat_room_id, auth.uid()))
    )
  )
);

CREATE POLICY "manage_mural_likes" ON public.mural_likes
FOR ALL USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM mural_posts mp 
    WHERE mp.id = post_id AND (
      (mp.sector_id IS NULL AND mp.chat_room_id IS NULL) OR
      mp.user_id = auth.uid() OR
      is_admin(auth.uid()) OR
      (mp.sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), mp.sector_id)) OR
      (mp.chat_room_id IS NOT NULL AND user_can_access_chat_room(mp.chat_room_id, auth.uid()))
    )
  )
) WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM mural_posts mp 
    WHERE mp.id = post_id AND (
      (mp.sector_id IS NULL AND mp.chat_room_id IS NULL) OR
      mp.user_id = auth.uid() OR
      is_admin(auth.uid()) OR
      (mp.sector_id IS NOT NULL AND user_belongs_to_sector(auth.uid(), mp.sector_id)) OR
      (mp.chat_room_id IS NOT NULL AND user_can_access_chat_room(mp.chat_room_id, auth.uid()))
    )
  )
);

-- Chat Rooms: Público visualiza ativos, criador gerencia
CREATE POLICY "view_chat_rooms" ON public.chat_rooms
FOR SELECT USING (
  (is_active = true AND user_can_access_chat_room(id, auth.uid())) OR
  created_by = auth.uid()
);

CREATE POLICY "create_chat_rooms" ON public.chat_rooms
FOR INSERT WITH CHECK (
  user_can_create_chat_room(auth.uid()) AND created_by = auth.uid()
);

CREATE POLICY "update_chat_rooms" ON public.chat_rooms
FOR UPDATE USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "delete_chat_rooms" ON public.chat_rooms
FOR DELETE USING (created_by = auth.uid());

-- Chat Room Sectors: Segue permissões do chat room
CREATE POLICY "view_chat_room_sectors" ON public.chat_room_sectors
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM chat_rooms cr 
    WHERE cr.id = chat_room_id AND (
      (cr.is_active = true AND user_can_access_chat_room(cr.id, auth.uid())) OR
      cr.created_by = auth.uid()
    )
  )
);

CREATE POLICY "manage_chat_room_sectors" ON public.chat_room_sectors
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM chat_rooms cr 
    WHERE cr.id = chat_room_id AND cr.created_by = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_rooms cr 
    WHERE cr.id = chat_room_id AND cr.created_by = auth.uid()
  )
);

-- ------------------------------
-- SISTEMA DE EVENTOS
-- ------------------------------

-- Events: Público (eventos são públicos na empresa)
CREATE POLICY "view_events" ON public.events
FOR SELECT USING (true);

CREATE POLICY "create_events" ON public.events
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "update_events" ON public.events
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "delete_events" ON public.events
FOR DELETE USING (auth.uid() = created_by);

-- Event Participants: Público visualiza, criador do evento gerencia
CREATE POLICY "view_event_participants" ON public.event_participants
FOR SELECT USING (true);

CREATE POLICY "create_event_participants" ON public.event_participants
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_id AND e.created_by = auth.uid()
  )
);

CREATE POLICY "update_event_participants" ON public.event_participants
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_id AND e.created_by = auth.uid()
  ) OR user_id = auth.uid()
);

CREATE POLICY "delete_event_participants" ON public.event_participants
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM events e 
    WHERE e.id = event_id AND e.created_by = auth.uid()
  )
);

-- ------------------------------
-- SISTEMA DE NOTIFICAÇÕES
-- ------------------------------

-- Notifications: Próprio
CREATE POLICY "view_notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "update_notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Notification Preferences: Próprio
CREATE POLICY "manage_notification_preferences" ON public.notification_preferences
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ------------------------------
-- SISTEMA ADMINISTRATIVO
-- ------------------------------

-- Admin Action Logs: Admin apenas
CREATE POLICY "view_admin_action_logs" ON public.admin_action_logs
FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "create_admin_action_logs" ON public.admin_action_logs
FOR INSERT WITH CHECK (
  is_admin(auth.uid()) AND admin_user_id = auth.uid()
);

-- System Settings: Público visualiza, Admin gerencia
CREATE POLICY "view_system_settings" ON public.system_settings
FOR SELECT USING (true);

CREATE POLICY "admin_manage_system_settings" ON public.system_settings
FOR ALL USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));