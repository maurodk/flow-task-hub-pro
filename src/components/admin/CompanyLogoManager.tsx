
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from 'sonner';
import { Building2, Upload, X } from 'lucide-react';

const CompanyLogoManager = () => {
  const { settings, uploadLogo, updateSetting } = useSystemSettings();
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      toast.error('Formato de arquivo não suportado. Use JPEG, PNG, WebP ou SVG.');
      return;
    }

    // Validar tamanho (2MB)
    if (file.size > 2097152) {
      toast.error('Arquivo muito grande. Máximo 2MB.');
      return;
    }

    setUploading(true);

    try {
      await uploadLogo(file);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = async () => {
    try {
      await updateSetting('company_logo', '');
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const currentLogo = settings.company_logo;

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Logo da Empresa
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-300">
          Configure o logo personalizado que aparecerá na navbar do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview do logo atual */}
        <div className="space-y-2">
          <Label className="text-gray-700 dark:text-gray-200">Logo Atual</Label>
          <div className="flex items-center justify-between p-4 border rounded-lg dark:border-slate-600">
            {currentLogo ? (
              <div className="flex items-center gap-4">
                <img 
                  src={currentLogo} 
                  alt="Logo da empresa" 
                  className="h-12 w-auto max-w-[200px] object-contain"
                />
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Logo personalizado ativo
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Building2 className="h-8 w-8" />
                  <span className="text-xl font-bold">EmpresaCorp</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Logo padrão (nenhum logo personalizado)
                </div>
              </div>
            )}
            
            {currentLogo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeLogo}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Upload de novo logo */}
        <div className="space-y-2">
          <Label htmlFor="logo-upload" className="text-gray-700 dark:text-gray-200">
            Fazer Upload de Novo Logo
          </Label>
          <div className="flex items-center gap-4">
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <Button 
                variant="outline" 
                disabled={uploading}
                className="flex items-center gap-2 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                asChild
              >
                <span>
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Enviando...' : 'Selecionar Logo'}
                </span>
              </Button>
            </Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            JPEG, PNG, WebP ou SVG até 2MB. Recomendado: 200x50px para melhor visualização.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyLogoManager;
