
export interface ActivityData {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  activity_type: 'standard' | 'template_based' | 'recurring';
  is_recurring?: boolean;
  recurrence_type?: string;
  recurrence_time?: string;
  template_id?: string;
  sector_id?: string;
  sector_name?: string;
  next_due_at?: string;
  last_completed_at?: string;
  progress: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  subtasks: SubtaskData[];
}

export interface ActivityFormData {
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  activity_type: 'standard' | 'template_based' | 'recurring';
  is_recurring: boolean;
  recurrence_type: string;
  recurrence_time: string;
  template_id: string;
  sector_id?: string;
}

export interface SubtaskData {
  id: string;
  activity_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  completed_at?: string;
  order_index: number;
  created_at: string;
}

export interface SubtaskFormData {
  title: string;
  description?: string;
  is_completed: boolean;
  order_index: number;
}

export interface UserTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  subtasks: UserTemplateSubtask[];
}

export interface UserTemplateSubtask {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
}
