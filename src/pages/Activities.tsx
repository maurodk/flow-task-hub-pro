
import React, { useState } from 'react';
import { useActivities } from '@/hooks/useActivities';
import ActivityList from '@/components/activities/ActivityList';
import ActivityForm from '@/components/activities/ActivityForm';
import { ActivityData } from '@/types/activity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Activities = () => {
  const { 
    activities, 
    userTemplates, 
    loading, 
    fetchActivities, 
    toggleSubtask, 
    deleteActivity, 
    createActivity 
  } = useActivities();
  
  const [editingActivity, setEditingActivity] = useState<ActivityData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateNew = () => {
    setEditingActivity(null);
    setIsDialogOpen(true);
  };

  const handleEditActivity = (activity: ActivityData) => {
    setEditingActivity(activity);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingActivity(null);
  };

  const handleSuccess = () => {
    fetchActivities();
    handleCloseDialog();
  };

  // Filtrar atividades por status
  const pendingActivities = activities.filter(activity => activity.status === 'pending');
  const inProgressActivities = activities.filter(activity => activity.status === 'in_progress');
  const onHoldActivities = activities.filter(activity => activity.status === 'on_hold');
  const completedActivities = activities.filter(activity => activity.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="relative">
                Pendentes
                {pendingActivities.length > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-2 py-1">
                    {pendingActivities.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="relative">
                Em Progresso
                {inProgressActivities.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                    {inProgressActivities.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="on_hold" className="relative">
                Em Espera
                {onHoldActivities.length > 0 && (
                  <span className="ml-2 bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                    {onHoldActivities.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="relative">
                Concluídas
                {completedActivities.length > 0 && (
                  <span className="ml-2 bg-green-500 text-white text-xs rounded-full px-2 py-1">
                    {completedActivities.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <ActivityList
                activities={pendingActivities}
                onEditActivity={handleEditActivity}
                onDeleteActivity={deleteActivity}
                onToggleSubtask={toggleSubtask}
                onCreateNew={handleCreateNew}
                isDialogOpen={isDialogOpen}
                setIsDialogOpen={setIsDialogOpen}
                title="Atividades Pendentes"
              >
                <ActivityForm
                  editingActivity={editingActivity}
                  userTemplates={userTemplates}
                  onSuccess={handleSuccess}
                  onClose={handleCloseDialog}
                  createActivity={createActivity}
                />
              </ActivityList>
            </TabsContent>

            <TabsContent value="in_progress">
              <ActivityList
                activities={inProgressActivities}
                onEditActivity={handleEditActivity}
                onDeleteActivity={deleteActivity}
                onToggleSubtask={toggleSubtask}
                onCreateNew={handleCreateNew}
                isDialogOpen={isDialogOpen}
                setIsDialogOpen={setIsDialogOpen}
                title="Atividades Em Progresso"
              >
                <ActivityForm
                  editingActivity={editingActivity}
                  userTemplates={userTemplates}
                  onSuccess={handleSuccess}
                  onClose={handleCloseDialog}
                  createActivity={createActivity}
                />
              </ActivityList>
            </TabsContent>

            <TabsContent value="on_hold">
              <ActivityList
                activities={onHoldActivities}
                onEditActivity={handleEditActivity}
                onDeleteActivity={deleteActivity}
                onToggleSubtask={toggleSubtask}
                onCreateNew={handleCreateNew}
                isDialogOpen={isDialogOpen}
                setIsDialogOpen={setIsDialogOpen}
                title="Atividades Em Espera"
              >
                <ActivityForm
                  editingActivity={editingActivity}
                  userTemplates={userTemplates}
                  onSuccess={handleSuccess}
                  onClose={handleCloseDialog}
                  createActivity={createActivity}
                />
              </ActivityList>
            </TabsContent>

            <TabsContent value="completed">
              <ActivityList
                activities={completedActivities}
                onEditActivity={handleEditActivity}
                onDeleteActivity={deleteActivity}
                onToggleSubtask={toggleSubtask}
                onCreateNew={handleCreateNew}
                isDialogOpen={isDialogOpen}
                setIsDialogOpen={setIsDialogOpen}
                title="Atividades Concluídas"
              >
                <ActivityForm
                  editingActivity={editingActivity}
                  userTemplates={userTemplates}
                  onSuccess={handleSuccess}
                  onClose={handleCloseDialog}
                  createActivity={createActivity}
                />
              </ActivityList>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Activities;
