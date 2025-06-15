
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Calendar, CheckCircle, Clock, Activity } from 'lucide-react';
import { ActivityData } from '@/types/activity';

interface ActivityCardProps {
  activity: ActivityData;
  onEdit: (activity: ActivityData) => void;
  onDelete: (activityId: string) => void;
  onToggleSubtask: (activityId: string, subtaskId: string, isCompleted: boolean) => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onEdit,
  onDelete,
  onToggleSubtask,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'in_progress': return <Activity className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      in_progress: 'Em Progresso',
      completed: 'Concluída',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(activity.status)}
              <CardTitle className="text-gray-900 dark:text-white">{activity.title}</CardTitle>
              <Badge className={getPriorityColor(activity.priority)}>
                {activity.priority}
              </Badge>
            </div>
            {activity.description && (
              <CardDescription className="text-gray-600 dark:text-gray-300">
                {activity.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(activity)}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(activity.id)}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Status: {getStatusLabel(activity.status)}
            </span>
            {activity.due_date && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Vence em: {new Date(activity.due_date).toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>

          {activity.subtasks && activity.subtasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Subtarefas ({activity.subtasks.filter(st => st.is_completed).length}/{activity.subtasks.length})
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {activity.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={subtask.is_completed}
                      onCheckedChange={() => onToggleSubtask(activity.id, subtask.id, subtask.is_completed)}
                    />
                    <span className={`text-sm ${subtask.is_completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Progresso</span>
              <span className="text-gray-900 dark:text-white font-medium">{activity.progress}%</span>
            </div>
            <Progress value={activity.progress} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
