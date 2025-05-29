
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save, X, GripVertical } from 'lucide-react';

interface UserTemplate {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  subtasks: UserTemplateSubtask[];
}

interface UserTemplateSubtask {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
}

const ActivityTemplateManager = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<UserTemplate | null>(null);
  
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
  });

  const [subtasks, setSubtasks] = useState<Omit<UserTemplateSubtask, 'id'>[]>([]);
  const [newSubtask, setNewSubtask] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      const { data: templatesData, error } = await supabase
        .from('user_activity_templates')
        .select(`
          *,
          user_template_subtasks (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTemplates = templatesData?.map(template => ({
        ...template,
        subtasks: template.user_template_subtasks.sort((a, b) => a.order_index - b.order_index)
      })) || [];

      setTemplates(formattedTemplates);
    } catch (error: any) {
      console.error('Erro ao buscar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!user || !templateForm.name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    try {
      let templateId: string;

      if (editingTemplate) {
        // Atualizar template existente
        const { error } = await supabase
          .from('user_activity_templates')
          .update({
            name: templateForm.name,
            description: templateForm.description,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        templateId = editingTemplate.id;

        // Deletar subtasks antigas
        await supabase
          .from('user_template_subtasks')
          .delete()
          .eq('template_id', templateId);
      } else {
        // Criar novo template
        const { data, error } = await supabase
          .from('user_activity_templates')
          .insert({
            user_id: user.id,
            name: templateForm.name,
            description: templateForm.description,
          })
          .select()
          .single();

        if (error) throw error;
        templateId = data.id;
      }

      // Inserir subtasks
      if (subtasks.length > 0) {
        const subtasksToInsert = subtasks.map((subtask, index) => ({
          template_id: templateId,
          title: subtask.title,
          description: subtask.description,
          order_index: index,
        }));

        const { error: subtasksError } = await supabase
          .from('user_template_subtasks')
          .insert(subtasksToInsert);

        if (subtasksError) throw subtasksError;
      }

      toast.success(editingTemplate ? 'Template atualizado!' : 'Template criado!');
      setIsDialogOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('user_activity_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast.success('Template excluído!');
      fetchTemplates();
    } catch (error: any) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const handleEditTemplate = (template: UserTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
    });
    setSubtasks(template.subtasks.map(st => ({
      title: st.title,
      description: st.description,
      order_index: st.order_index,
    })));
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setTemplateForm({ name: '', description: '' });
    setSubtasks([]);
    setNewSubtask({ title: '', description: '' });
    setEditingTemplate(null);
  };

  const addSubtask = () => {
    if (!newSubtask.title.trim()) {
      toast.error('Título da subtarefa é obrigatório');
      return;
    }

    setSubtasks([...subtasks, {
      title: newSubtask.title,
      description: newSubtask.description,
      order_index: subtasks.length,
    }]);
    setNewSubtask({ title: '', description: '' });
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Templates de Atividades</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Crie templates reutilizáveis para suas atividades com subtarefas predefinidas.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">
                {editingTemplate ? 'Editar Template' : 'Criar Novo Template'}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-300">
                Defina um nome, descrição e as subtarefas do seu template.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateName" className="text-gray-700 dark:text-gray-200">Nome do Template</Label>
                  <Input
                    id="templateName"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Ex: Lançamento CV"
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="templateDescription" className="text-gray-700 dark:text-gray-200">Descrição (opcional)</Label>
                  <Textarea
                    id="templateDescription"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    placeholder="Descreva o propósito deste template..."
                    className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>

              {/* Subtarefas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Subtarefas</h3>
                
                {/* Lista de subtarefas */}
                {subtasks.length > 0 && (
                  <div className="space-y-2">
                    {subtasks.map((subtask, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">{subtask.title}</p>
                          {subtask.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300">{subtask.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubtask(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Adicionar nova subtarefa */}
                <div className="border-t pt-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      value={newSubtask.title}
                      onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                      placeholder="Título da subtarefa"
                      className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    <Input
                      value={newSubtask.description}
                      onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                      placeholder="Descrição (opcional)"
                      className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSubtask}
                    className="w-full dark:border-slate-600 dark:text-slate-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Subtarefa
                  </Button>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Nenhum template criado ainda.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Template
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-gray-900 dark:text-white">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="text-gray-600 dark:text-gray-300">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="dark:bg-slate-700 dark:text-slate-200">
                      {template.subtasks.length} subtarefas
                    </Badge>
                  </div>
                  
                  {template.subtasks.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Subtarefas:</p>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {template.subtasks.slice(0, 3).map((subtask, index) => (
                          <li key={subtask.id} className="truncate">
                            {index + 1}. {subtask.title}
                          </li>
                        ))}
                        {template.subtasks.length > 3 && (
                          <li className="text-xs italic">
                            +{template.subtasks.length - 3} mais...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityTemplateManager;
