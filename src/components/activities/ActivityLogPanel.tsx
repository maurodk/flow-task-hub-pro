
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Activity } from 'lucide-react';
import { useActivityLog } from '@/hooks/useActivityLog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ActivityLogPanelProps {
  activityId: string;
}

const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({ activityId }) => {
  const { logs, loading, getActionText, getActionColor } = useActivityLog(activityId);

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
            <Activity className="h-5 w-5" />
            Histórico da Atividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg">
          <Activity className="h-5 w-5" />
          Histórico da Atividade ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Nenhum histórico encontrado para esta atividade
            </p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3 pr-4">
              {logs.map((log) => (
                <div key={log.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4 pb-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {log.user_name || 'Usuário'}
                        </span>
                        <span className="mx-1 text-gray-500 dark:text-gray-400">
                          {getActionText(log)}
                        </span>
                        {!log.details && (
                          <span className={`font-medium ${getActionColor(log.action_type)}`}>
                            "{log.activity_title}"
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          ({new Date(log.created_at).toLocaleString('pt-BR')})
                        </span>
                      </div>
                    </div>
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

export default ActivityLogPanel;
