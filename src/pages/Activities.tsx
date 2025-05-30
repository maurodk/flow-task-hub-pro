
import React, { useState } from 'react';
import { useActivities } from '@/hooks/useActivities';
import ActivityList from '@/components/activities/ActivityList';
import ActivityForm from '@/components/activities/ActivityForm';
import { ActivityData } from '@/types/activity';

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
              onSuccess={handleSuccess}
              onClose={handleCloseDialog}
              createActivity={createActivity}
            />
          </ActivityList>
        </div>
      </div>
    </div>
  );
};

export default Activities;
