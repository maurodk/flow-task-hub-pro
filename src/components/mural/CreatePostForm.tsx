
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import FileUpload from './FileUpload';

interface CreatePostFormProps {
  onSubmit: (title: string, content: string, activityIds: string[], files?: File[]) => void;
  userActivities: {id: string; title: string}[];
  loading?: boolean;
}

const CreatePostForm: React.FC<CreatePostFormProps> = ({ onSubmit, userActivities, loading = false }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      return;
    }

    onSubmit(title.trim(), content.trim(), selectedActivityIds, files);
    setTitle('');
    setContent('');
    setSelectedActivityIds([]);
    setSelectedActivityId('');
    setFiles([]);
  };

  const addActivity = () => {
    if (selectedActivityId && !selectedActivityIds.includes(selectedActivityId)) {
      setSelectedActivityIds([...selectedActivityIds, selectedActivityId]);
      setSelectedActivityId('');
    }
  };

  const removeActivity = (activityIdToRemove: string) => {
    setSelectedActivityIds(selectedActivityIds.filter(id => id !== activityIdToRemove));
  };

  const getActivityTitle = (activityId: string) => {
    return userActivities.find(activity => activity.id === activityId)?.title || 'Atividade';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Criar Nova Publicação</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Título da publicação..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Textarea
              placeholder="Escreva sua publicação..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div>
            <div className="flex gap-2 mb-2">
              <Select value={selectedActivityId} onValueChange={setSelectedActivityId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar atividade relacionada..." />
                </SelectTrigger>
                <SelectContent>
                  {userActivities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addActivity}
                disabled={!selectedActivityId || selectedActivityIds.includes(selectedActivityId)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {selectedActivityIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedActivityIds.map((activityId) => (
                  <Badge key={activityId} variant="secondary" className="flex items-center gap-1">
                    {getActivityTitle(activityId)}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeActivity(activityId)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <FileUpload files={files} onFilesChange={setFiles} />

          <Button type="submit" disabled={loading || !title.trim() || !content.trim()}>
            {loading ? 'Publicando...' : 'Publicar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;
