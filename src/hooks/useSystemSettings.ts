
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsMap = data?.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value || '';
        return acc;
      }, {} as Record<string, string>) || {};

      setSettings(settingsMap);
    } catch (error: any) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Configuração atualizada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configuração');
      throw error;
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo.${fileExt}`;

      // Fazer upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('system-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('system-assets')
        .getPublicUrl(fileName);

      const logoUrl = data.publicUrl;

      // Atualizar configuração
      await updateSetting('company_logo', logoUrl);

      return logoUrl;
    } catch (error: any) {
      console.error('Erro ao fazer upload do logo:', error);
      toast.error('Erro ao fazer upload do logo');
      throw error;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    updateSetting,
    uploadLogo,
    refetch: fetchSettings,
  };
};
