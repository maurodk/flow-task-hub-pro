
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog } from '@/components/ui/dialog';
import { File } from 'lucide-react';
import { ActivityData } from '@/types/activity';
import { useActivities } from '@/hooks/useActivities';
import ActivityTemplateManager from '@/components/ActivityTemplateManager';
import ActivityList from '@/components/activities/ActivityList';
import ActivityForm from '@/components/activities/ActivityForm';

const Activities = () => {
  const {
    activities,
    userTemplates,
    loading,
    fetchActivities,
    toggleSubtask,
    deleteActivity,
  } = useActivities();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityData | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  const handleEditActivity = (activity: ActivityData) => {
    setEditingActivity(activity);
    setIsDialogOpen(true);
  };

  const handleCreateNew = () => {
    setEditingActivity(null);
    setIsDialogOpen(true);
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingActivity(null);
    fetchActivities();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingActivity(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando atividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Atividades</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Gerencie suas atividades, templates e acompanhe o progresso.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 dark:bg-slate-800">
            <TabsTrigger value="list" className="dark:data-[state=active]:bg-slate-700">
              Lista de Atividades
            </TabsTrigger>
            <TabsTrigger value="templates" className="dark:data-[state=active]:bg-slate-700">
              <File className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-6">
            <ActivityList
              activities={activities}
              onEditActivity={handleEditActivity}
              onDeleteActivity={deleteActivity}
              onToggleSubtask={toggleSubtask}
              onCreateNew={handleCreateNew}
              isDialogOpen={isDialogOpen}
              setIsDialogOpen={setIsDialogOpen}
            >
              <ActivityForm
                editingActivity={editingActivity}
                userTemplates={userTemplates}
                onSuccess={handleFormSuccess}
                onClose={handleCloseDialog}
              />
            </ActivityList>
          </TabsContent>

          <TabsContent value="templates">
            <ActivityTemplateManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Activities;
