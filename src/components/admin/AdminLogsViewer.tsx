import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAdminLogs } from '@/hooks/useAdminLogs';
import { Shield, Trash2, RefreshCw } from 'lucide-react';

const AdminLogsViewer = () => {
  const { logs, loading, isAdmin, fetchAdminLogs } = useAdminLogs();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminLogs();
    setRefreshing(false);
  };

  if (!isAdmin) {
    return null;
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'delete_post':
        return <Trash2 className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'delete_post':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getActionText = (actionType: string) => {
    switch (actionType) {
      case 'delete_post':
        return 'Exclusão de Post';
      default:
        return 'Ação Administrativa';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Logs Administrativos
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            Nenhuma ação administrativa registrada
          </p>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionColor(log.action_type) as any}>
                        {getActionIcon(log.action_type)}
                        {getActionText(log.action_type)}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Admin: 
                      </span>
                      <span className="ml-1 text-gray-700 dark:text-gray-300">
                        {log.details?.admin_name || 'Admin'}
                      </span>
                    </div>
                    
                    {log.target_title && (
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Alvo: 
                        </span>
                        <span className="ml-1 text-gray-700 dark:text-gray-300">
                          "{log.target_title}"
                        </span>
                      </div>
                    )}
                    
                    {log.target_user_name && (
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Usuário: 
                        </span>
                        <span className="ml-1 text-gray-700 dark:text-gray-300">
                          {log.target_user_name}
                        </span>
                      </div>
                    )}
                    
                    {log.details?.content_preview && (
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Prévia: 
                        </span>
                        <span className="ml-1 text-gray-700 dark:text-gray-300 text-sm">
                          {log.details.content_preview}
                        </span>
                      </div>
                    )}
                    
                    {log.details?.reason && (
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          Motivo: 
                        </span>
                        <span className="ml-1 text-gray-700 dark:text-gray-300">
                          {log.details.reason}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminLogsViewer;