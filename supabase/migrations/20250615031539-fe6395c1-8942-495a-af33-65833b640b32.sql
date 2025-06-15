
-- Criar tabela para configurações do sistema
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política para admins poderem ver e editar todas as configurações
CREATE POLICY "Admins can manage system settings" 
  ON public.system_settings 
  FOR ALL 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Política para usuários autenticados poderem ver configurações (logo)
CREATE POLICY "Users can view system settings" 
  ON public.system_settings 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Criar bucket para armazenar logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('system-assets', 'system-assets', true);

-- Política para admins poderem fazer upload de arquivos
CREATE POLICY "Admins can upload system assets" 
  ON storage.objects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    bucket_id = 'system-assets' 
    AND public.is_admin(auth.uid())
  );

-- Política para admins poderem atualizar arquivos
CREATE POLICY "Admins can update system assets" 
  ON storage.objects 
  FOR UPDATE 
  TO authenticated 
  USING (
    bucket_id = 'system-assets' 
    AND public.is_admin(auth.uid())
  );

-- Política para todos poderem ver os assets
CREATE POLICY "Anyone can view system assets" 
  ON storage.objects 
  FOR SELECT 
  TO public 
  USING (bucket_id = 'system-assets');
