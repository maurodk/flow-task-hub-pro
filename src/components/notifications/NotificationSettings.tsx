
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useNotificationContext } from '@/contexts/NotificationContext';

export const NotificationSettings = () => {
  const { preferences, preferencesLoading, updatePreferences } = useNotificationContext();

  if (preferencesLoading || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Notificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando configurações...</div>
        </CardContent>
      </Card>
    );
  }

  const handleNotificationTypeChange = (type: string, enabled: boolean) => {
    updatePreferences({
      notification_types: {
        ...preferences.notification_types,
        [type]: enabled
      }
    });
  };

  const handleGeneralSettingChange = (setting: string, value: any) => {
    updatePreferences({
      [setting]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Notificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configurações Gerais */}
        <div className="space-y-4">
          <h4 className="font-medium">Configurações Gerais</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push-enabled">Notificações Push</Label>
            <Switch
              id="push-enabled"
              checked={preferences.push_enabled}
              onCheckedChange={(checked) => handleGeneralSettingChange('push_enabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="email-enabled">Notificações por Email</Label>
            <Switch
              id="email-enabled"
              checked={preferences.email_enabled}
              onCheckedChange={(checked) => handleGeneralSettingChange('email_enabled', checked)}
            />
          </div>
        </div>

        {/* Tipos de Notificação */}
        <div className="space-y-4">
          <h4 className="font-medium">Tipos de Notificação</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="activity-created">Novas Atividades</Label>
              <Switch
                id="activity-created"
                checked={preferences.notification_types.activity_created}
                onCheckedChange={(checked) => handleNotificationTypeChange('activity_created', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="activity-updated">Atualizações de Atividades</Label>
              <Switch
                id="activity-updated"
                checked={preferences.notification_types.activity_updated}
                onCheckedChange={(checked) => handleNotificationTypeChange('activity_updated', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="subtask-completed">Subtarefas Concluídas</Label>
              <Switch
                id="subtask-completed"
                checked={preferences.notification_types.subtask_completed}
                onCheckedChange={(checked) => handleNotificationTypeChange('subtask_completed', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="mural-post">Mensagens no Mural</Label>
              <Switch
                id="mural-post"
                checked={preferences.notification_types.mural_post_created}
                onCheckedChange={(checked) => handleNotificationTypeChange('mural_post_created', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="event-24h">Eventos (24h antes)</Label>
              <Switch
                id="event-24h"
                checked={preferences.notification_types.event_reminder_24h}
                onCheckedChange={(checked) => handleNotificationTypeChange('event_reminder_24h', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="event-1h">Eventos (1h antes)</Label>
              <Switch
                id="event-1h"
                checked={preferences.notification_types.event_reminder_1h}
                onCheckedChange={(checked) => handleNotificationTypeChange('event_reminder_1h', checked)}
              />
            </div>
          </div>
        </div>

        {/* Horário Silencioso */}
        <div className="space-y-4">
          <h4 className="font-medium">Horário Silencioso</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiet-start">Início</Label>
              <Input
                id="quiet-start"
                type="time"
                value={preferences.quiet_hours_start || ''}
                onChange={(e) => handleGeneralSettingChange('quiet_hours_start', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="quiet-end">Fim</Label>
              <Input
                id="quiet-end"
                type="time"
                value={preferences.quiet_hours_end || ''}
                onChange={(e) => handleGeneralSettingChange('quiet_hours_end', e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
