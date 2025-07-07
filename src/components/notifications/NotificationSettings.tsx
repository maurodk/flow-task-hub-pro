
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { toast } from '@/hooks/use-toast';

interface NotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { 
    preferences, 
    updatePreferences, 
    requestNotificationPermission 
  } = useNotificationContext();

  const handleNotificationTypeChange = async (type: string, enabled: boolean) => {
    if (!preferences) return;

    try {
      await updatePreferences({
        notification_types: {
          ...preferences.notification_types,
          [type]: enabled
        }
      });
      
      toast({
        title: "Preferências atualizadas",
        description: "Suas configurações de notificação foram salvas.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as preferências.",
        variant: "destructive",
      });
    }
  };

  const handlePushNotificationChange = async (enabled: boolean) => {
    if (!preferences) return;

    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast({
          title: "Permissão negada",
          description: "Para receber notificações, permita no seu navegador.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      await updatePreferences({ push_enabled: enabled });
      
      toast({
        title: "Configuração atualizada",
        description: `Notificações push ${enabled ? 'ativadas' : 'desativadas'}.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a configuração.",
        variant: "destructive",
      });
    }
  };

  const handleQuietHoursChange = async (field: 'start' | 'end', value: string) => {
    if (!preferences) return;

    try {
      await updatePreferences({
        [`quiet_hours_${field}`]: value || null
      });
      
      toast({
        title: "Horários atualizados",
        description: "Seus horários de silêncio foram configurados.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os horários.",
        variant: "destructive",
      });
    }
  };

  if (!preferences) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configurações de Notificação</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipos de Notificação */}
          <div>
            <h3 className="font-medium mb-3">Tipos de Notificação</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="activity_created" className="text-sm">
                  Atividades criadas
                </Label>
                <Switch
                  id="activity_created"
                  checked={preferences.notification_types.activity_created}
                  onCheckedChange={(checked) => 
                    handleNotificationTypeChange('activity_created', checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="activity_updated" className="text-sm">
                  Atividades atualizadas
                </Label>
                <Switch
                  id="activity_updated"
                  checked={preferences.notification_types.activity_updated}
                  onCheckedChange={(checked) => 
                    handleNotificationTypeChange('activity_updated', checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="subtask_completed" className="text-sm">
                  Subtarefas concluídas
                </Label>
                <Switch
                  id="subtask_completed"
                  checked={preferences.notification_types.subtask_completed}
                  onCheckedChange={(checked) => 
                    handleNotificationTypeChange('subtask_completed', checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="event_reminder" className="text-sm">
                  Lembretes de eventos
                </Label>
                <Switch
                  id="event_reminder"
                  checked={preferences.notification_types.event_reminder}
                  onCheckedChange={(checked) => 
                    handleNotificationTypeChange('event_reminder', checked)
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações de Entrega */}
          <div>
            <h3 className="font-medium mb-3">Métodos de Notificação</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="push_enabled" className="text-sm">
                  Notificações push no navegador
                </Label>
                <Switch
                  id="push_enabled"
                  checked={preferences.push_enabled}
                  onCheckedChange={handlePushNotificationChange}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="email_enabled" className="text-sm">
                  Notificações por email
                </Label>
                <Switch
                  id="email_enabled"
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked) => 
                    updatePreferences({ email_enabled: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Horários de Silêncio */}
          <div>
            <h3 className="font-medium mb-3">Horários de Silêncio</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="quiet_start" className="text-sm">
                  Início (opcional)
                </Label>
                <Input
                  id="quiet_start"
                  type="time"
                  value={preferences.quiet_hours_start || ''}
                  onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="quiet_end" className="text-sm">
                  Fim (opcional)
                </Label>
                <Input
                  id="quiet_end"
                  type="time"
                  value={preferences.quiet_hours_end || ''}
                  onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <p className="text-xs text-gray-500">
                Durante estes horários, você não receberá notificações push.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettings;
