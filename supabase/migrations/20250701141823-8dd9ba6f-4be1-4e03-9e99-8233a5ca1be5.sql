
-- FASE 1: PROTEÇÃO CRÍTICA (PRIORIDADE MÁXIMA)

-- 1. Proteger tabela ACTIVITIES
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Políticas para activities baseadas em setores e proprietário
CREATE POLICY "Users can view activities from their sectors or own" 
ON public.activities 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR 
  (sector_id IS NOT NULL AND public.user_belongs_to_sector(auth.uid(), sector_id)) OR
  public.is_admin(auth.uid())
);

CREATE POLICY "Users can create activities" 
ON public.activities 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own activities or sector activities if admin" 
ON public.activities 
FOR UPDATE 
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_admin(auth.uid())
)
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own activities or if admin" 
ON public.activities 
FOR DELETE 
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_admin(auth.uid())
);

-- 2. Proteger tabela MURAL_POSTS
ALTER TABLE public.mural_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view posts from accessible chat rooms or sectors" 
ON public.mural_posts 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR
  (chat_room_id IS NOT NULL AND public.user_can_access_chat_room(chat_room_id, auth.uid())) OR
  (sector_id IS NOT NULL AND public.user_belongs_to_sector(auth.uid(), sector_id)) OR
  public.is_admin(auth.uid())
);

CREATE POLICY "Users can create posts" 
ON public.mural_posts 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own posts" 
ON public.mural_posts 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own posts" 
ON public.mural_posts 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- 3. Proteger tabela MURAL_COMMENTS
ALTER TABLE public.mural_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments from accessible posts" 
ON public.mural_comments 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.mural_posts mp 
    WHERE mp.id = post_id 
    AND (
      mp.user_id = auth.uid() OR
      (mp.chat_room_id IS NOT NULL AND public.user_can_access_chat_room(mp.chat_room_id, auth.uid())) OR
      (mp.sector_id IS NOT NULL AND public.user_belongs_to_sector(auth.uid(), mp.sector_id)) OR
      public.is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Users can create comments on accessible posts" 
ON public.mural_comments 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.mural_posts mp 
    WHERE mp.id = post_id 
    AND (
      mp.user_id = auth.uid() OR
      (mp.chat_room_id IS NOT NULL AND public.user_can_access_chat_room(mp.chat_room_id, auth.uid())) OR
      (mp.sector_id IS NOT NULL AND public.user_belongs_to_sector(auth.uid(), mp.sector_id)) OR
      public.is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Users can update own comments" 
ON public.mural_comments 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" 
ON public.mural_comments 
FOR DELETE 
TO authenticated
USING (user_id = auth.uid());

-- 4. Proteger tabela MURAL_LIKES
ALTER TABLE public.mural_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes from accessible posts" 
ON public.mural_likes 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.mural_posts mp 
    WHERE mp.id = post_id 
    AND (
      mp.user_id = auth.uid() OR
      (mp.chat_room_id IS NOT NULL AND public.user_can_access_chat_room(mp.chat_room_id, auth.uid())) OR
      (mp.sector_id IS NOT NULL AND public.user_belongs_to_sector(auth.uid(), mp.sector_id)) OR
      public.is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Users can manage own likes on accessible posts" 
ON public.mural_likes 
FOR ALL 
TO authenticated
USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.mural_posts mp 
    WHERE mp.id = post_id 
    AND (
      mp.user_id = auth.uid() OR
      (mp.chat_room_id IS NOT NULL AND public.user_can_access_chat_room(mp.chat_room_id, auth.uid())) OR
      (mp.sector_id IS NOT NULL AND public.user_belongs_to_sector(auth.uid(), mp.sector_id)) OR
      public.is_admin(auth.uid())
    )
  )
)
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.mural_posts mp 
    WHERE mp.id = post_id 
    AND (
      mp.user_id = auth.uid() OR
      (mp.chat_room_id IS NOT NULL AND public.user_can_access_chat_room(mp.chat_room_id, auth.uid())) OR
      (mp.sector_id IS NOT NULL AND public.user_belongs_to_sector(auth.uid(), mp.sector_id)) OR
      public.is_admin(auth.uid())
    )
  )
);

-- 5. Proteger tabela USER_ROLES
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_admin(auth.uid())
);

CREATE POLICY "Only admins can manage roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update roles" 
ON public.user_roles 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete roles" 
ON public.user_roles 
FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- 6. Proteger tabela USER_SECTORS
ALTER TABLE public.user_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sectors" 
ON public.user_sectors 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_admin(auth.uid())
);

CREATE POLICY "Only admins can manage user sectors" 
ON public.user_sectors 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update user sectors" 
ON public.user_sectors 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete user sectors" 
ON public.user_sectors 
FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- 7. Proteger tabela PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile and admins can view all" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  id = auth.uid() OR 
  public.is_admin(auth.uid())
);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 8. Proteger ACTIVITY_SUBTASKS
ALTER TABLE public.activity_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subtasks of accessible activities" 
ON public.activity_subtasks 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a 
    WHERE a.id = activity_id 
    AND (
      a.user_id = auth.uid() OR 
      (a.sector_id IS NOT NULL AND public.user_belongs_to_sector(auth.uid(), a.sector_id)) OR
      public.is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Users can manage subtasks of own activities" 
ON public.activity_subtasks 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.activities a 
    WHERE a.id = activity_id 
    AND (
      a.user_id = auth.uid() OR 
      public.is_admin(auth.uid())
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.activities a 
    WHERE a.id = activity_id 
    AND a.user_id = auth.uid()
  )
);

-- 9. Proteger USER_ACTIVITY_TEMPLATES
ALTER TABLE public.user_activity_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own templates" 
ON public.user_activity_templates 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_admin(auth.uid())
);

CREATE POLICY "Users can manage own templates" 
ON public.user_activity_templates 
FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 10. Proteger USER_TEMPLATE_SUBTASKS
ALTER TABLE public.user_template_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subtasks of own templates" 
ON public.user_template_subtasks 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_activity_templates t 
    WHERE t.id = template_id 
    AND (
      t.user_id = auth.uid() OR 
      public.is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Users can manage subtasks of own templates" 
ON public.user_template_subtasks 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_activity_templates t 
    WHERE t.id = template_id 
    AND t.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_activity_templates t 
    WHERE t.id = template_id 
    AND t.user_id = auth.uid()
  )
);

-- 11. Proteger SECTORS (permitir visualização mas apenas admins podem gerenciar)
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sectors" 
ON public.sectors 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage sectors" 
ON public.sectors 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can update sectors" 
ON public.sectors 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can delete sectors" 
ON public.sectors 
FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- 12. Proteger ACTIVITY_TEMPLATES (globais - só admins podem gerenciar)
ALTER TABLE public.activity_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity templates" 
ON public.activity_templates 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage activity templates" 
ON public.activity_templates 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 13. Proteger ACTIVITY_TEMPLATE_SUBTASKS
ALTER TABLE public.activity_template_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view template subtasks" 
ON public.activity_template_subtasks 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage template subtasks" 
ON public.activity_template_subtasks 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 14. Proteger ACTIVITY_PROGRESS_LOGS
ALTER TABLE public.activity_progress_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view progress logs of accessible activities" 
ON public.activity_progress_logs 
FOR SELECT 
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.activities a 
    WHERE a.id = activity_id 
    AND (
      a.user_id = auth.uid() OR 
      (a.sector_id IS NOT NULL AND public.user_belongs_to_sector(auth.uid(), a.sector_id)) OR
      public.is_admin(auth.uid())
    )
  )
);

CREATE POLICY "Users can create progress logs for accessible activities" 
ON public.activity_progress_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.activities a 
    WHERE a.id = activity_id 
    AND (
      a.user_id = auth.uid() OR 
      (a.sector_id IS NOT NULL AND public.user_belongs_to_sector(auth.uid(), a.sector_id)) OR
      public.is_admin(auth.uid())
    )
  )
);
