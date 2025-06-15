
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSectors } from '@/hooks/useSectors';

interface CreateChatRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, sectorIds: string[]) => Promise<void>;
}

const CreateChatRoomModal: React.FC<CreateChatRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sectors } = useSectors();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Submitting chat room:', { name: name.trim(), description: description.trim(), selectedSectors });
      
      await onSubmit(name.trim(), description.trim(), selectedSectors);
      
      // Reset form only on success
      setName('');
      setDescription('');
      setSelectedSectors([]);
      onClose();
    } catch (error) {
      console.error('Error submitting chat room:', error);
      // Don't close modal on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDescription('');
      setSelectedSectors([]);
      onClose();
    }
  };

  const handleSectorToggle = (sectorId: string) => {
    setSelectedSectors(prev => 
      prev.includes(sectorId) 
        ? prev.filter(id => id !== sectorId)
        : [...prev, sectorId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Chat Customizado</DialogTitle>
          <DialogDescription>
            Crie um chat específico para discussões organizadas por setores.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Chat *</Label>
            <Input
              id="name"
              placeholder="Ex: Projeto Alpha, Reunião Semanal..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito deste chat..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Setores com Acesso</Label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {sectors.map((sector) => (
                <div key={sector.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={sector.id}
                    checked={selectedSectors.includes(sector.id)}
                    onCheckedChange={() => handleSectorToggle(sector.id)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor={sector.id} className="text-sm cursor-pointer">
                    {sector.name}
                  </Label>
                </div>
              ))}
            </div>
            {selectedSectors.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sem setores selecionados = chat público para todos
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Criando...' : 'Criar Chat'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChatRoomModal;
