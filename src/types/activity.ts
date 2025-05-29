
export interface ActivityData {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  progress: number;
  activity_type: 'standard' | 'template_based' | 'recurring';
  is_recurring: boolean;
  recurrence_type: string | null;
  recurrence_time: string | null;
  created_at: string;
  template_id: string | null;
  subtasks?: SubtaskData[];
}

export interface SubtaskData {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  order_index: number;
}

export interface UserTemplate {
  id: string;
  name: string;
  description: string | null;
  subtasks: UserTemplateSubtask[];
}

export interface UserTemplateSubtask {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

export interface ActivityFormData {
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  due_date: string;
  activity_type: 'standard' | 'template_based' | 'recurring';
  is_recurring: boolean;
  recurrence_type: string;
  recurrence_time: string;
  template_id: string;
}
