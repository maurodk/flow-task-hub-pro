
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import FileUpload from './FileUpload';
import { MuralPost } from '@/hooks/useMural';

interface EditPostModalProps {
  post: MuralPost | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, content: string, activityIds: string[], sectorId?: string, files?: File[]) => void;
  userActivities: { id: string; title: string }[];
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  isOpen,
  onClose,
  onSave,
  userActivities,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      setSelectedActivities(post.activity_ids || []);
      setFiles([]);
    }
  }, [post]);

  const handleSave = () => {
    if (title.trim() && content.trim() && post) {
      onSave(title, content, selectedActivities, post.sector_id, files.length > 0 ? files : undefined);
      onClose();
    }
  };

  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const removeActivity = (activityId: string) => {
    setSelectedActivities(prev => prev.filter(id => id !== activityId));
  };

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Título</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do post..."
            />
          </div>

          <div>
            <Label htmlFor="edit-content">Conteúdo</Label>
            <Textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o conteúdo do seu post..."
              rows={4}
            />
          </div>

          <div>
            <Label>Atividades Relacionadas</Label>
            <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {userActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-2 p-1">
                  <input
                    type="checkbox"
                    id={`edit-activity-${activity.id}`}
                    checked={selectedActivities.includes(activity.id)}
                    onChange={() => toggleActivity(activity.id)}
                    className="rounded"
                  />
                  <label htmlFor={`edit-activity-${activity.id}`} className="text-sm cursor-pointer flex-1">
                    {activity.title}
                  </label>
                </div>
              ))}
            </div>
            
            {selectedActivities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedActivities.map((activityId) => {
                  const activity = userActivities.find(a => a.id === activityId);
                  return activity ? (
                    <Badge key={activityId} variant="secondary" className="flex items-center gap-1">
                      {activity.title}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeActivity(activityId)}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div>
            <Label>Anexos (substitui anexos existentes)</Label>
            <FileUpload
              files={files}
              onFilesChange={setFiles}
              maxFiles={5}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!title.trim() || !content.trim()}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;
