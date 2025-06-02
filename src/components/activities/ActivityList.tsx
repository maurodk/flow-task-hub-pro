
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { ActivityData } from '@/types/activity';
import ActivityCard from './ActivityCard';

interface ActivityListProps {
  activities: ActivityData[];
  onEditActivity: (activity: ActivityData) => void;
  onDeleteActivity: (activityId: string) => void;
  onToggleSubtask: (activityId: string, subtaskId: string, isCompleted: boolean) => void;
  onCreateNew: () => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
}

const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  onEditActivity,
  onDeleteActivity,
  onToggleSubtask,
  onCreateNew,
  isDialogOpen,
  setIsDialogOpen,
  children,
  title = "Minhas Atividades",
}) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title} ({activities.length})
          </h2>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={onCreateNew} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Atividade
            </Button>
          </DialogTrigger>
          {children}
        </Dialog>
      </div>

      <div className="space-y-4 mt-6">
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Nenhuma atividade encontrada nesta categoria.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={onCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Nova Atividade
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              onEdit={onEditActivity}
              onDelete={onDeleteActivity}
              onToggleSubtask={onToggleSubtask}
            />
          ))
        )}
      </div>
    </>
  );
};

export default ActivityList;
