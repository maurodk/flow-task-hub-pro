
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Eye, Clock } from 'lucide-react';
import { useActivityLogs } from '@/hooks/useActivityLogs';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ActivityLogsSection: React.FC = () => {
  const { logs, loading, fetchLogs, getActionText, getActionColor } = useActivityLogs();
  const [showFullLog, setShowFullLog] = useState(false);
  const [fullLogs, setFullLogs] = useState<any[]>([]);

  const handleShowFullLog = async () => {
    setShowFullLog(true);
    const fullLogsData = await fetchLogs(50); // Buscar mais logs para o modal
    setFullLogs(fullLogsData);
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Activity className="h-5 w-5" />
            Atividade Recente
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
    <>
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            {logs.length > 0 && (
              <Dialog open={showFullLog} onOpenChange={setShowFullLog}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShowFullLog}
                    className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver mais
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Log Completo de Atividades
                    </DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96">
                    <div className="space-y-3 pr-4">
                      {fullLogs.map((log) => (
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
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDistanceToNow(new Date(log.created_at), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhuma atividade recente encontrada
              </p>
            </div>
          ) : (
            logs.slice(0, 5).map((log) => (
              <div key={log.id} className="text-sm border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                <p className="text-gray-900 dark:text-white">
                  <span className="font-medium">{log.user_name || 'Usuário'}</span>
                  <span className="mx-1 text-gray-600 dark:text-gray-300">
                    {getActionText(log)}
                  </span>
                </p>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(new Date(log.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ActivityLogsSection;
