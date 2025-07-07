
import React, { createContext, useContext, ReactNode } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { toast } from '@/hooks/use-toast';

interface NotificationContextType {
  notifications: ReturnType<typeof useNotifications>['notifications'];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  getNotificationIcon: (type: any) => string;
  preferences: ReturnType<typeof useNotificationPreferences>['preferences'];
  updatePreferences: ReturnType<typeof useNotificationPreferences>['updatePreferences'];
  requestNotificationPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notifications = useNotifications();
  const notificationPreferences = useNotificationPreferences();

  // Mostrar toast para novas notificações quando apropriado
  React.useEffect(() => {
    if (notifications.notifications.length > 0) {
      const latestNotification = notifications.notifications[0];
      
      // Verificar se é uma notificação nova (criada nos últimos 5 segundos)
      const isRecent = new Date(latestNotification.created_at).getTime() > 
                      Date.now() - (5 * 1000);
      
      if (isRecent && !latestNotification.read_at) {
        toast({
          title: `${notifications.getNotificationIcon(latestNotification.type)} ${latestNotification.title}`,
          description: latestNotification.message,
          duration: 5000,
        });
      }
    }
  }, [notifications.notifications]);

  const value: NotificationContextType = {
    notifications: notifications.notifications,
    unreadCount: notifications.unreadCount,
    loading: notifications.loading,
    markAsRead: notifications.markAsRead,
    markAllAsRead: notifications.markAllAsRead,
    getNotificationIcon: notifications.getNotificationIcon,
    preferences: notificationPreferences.preferences,
    updatePreferences: notificationPreferences.updatePreferences,
    requestNotificationPermission: notificationPreferences.requestNotificationPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
