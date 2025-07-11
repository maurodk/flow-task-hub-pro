
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSectors } from '@/hooks/useSectors';
import { ChatRoom } from '@/hooks/useChatRooms';
import { toast } from 'sonner';

interface EditChatRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roomId: string, name: string, description: string, sectorIds: string[]) => Promise<void>;
  chatRoom: ChatRoom | null;
}

const EditChatRoomModal: React.FC<EditChatRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  chatRoom
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sectors, loading: sectorsLoading } = useSectors();

  // Preencher formulário quando o chat room muda
  useEffect(() => {
    if (chatRoom) {
      setName(chatRoom.name);
      setDescription(chatRoom.description || '');
      setSelectedSectors(chatRoom.sectors?.map(s => s.id) || []);
    }
  }, [chatRoom]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatRoom) {
      toast.error('Chat não encontrado');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Nome do chat é obrigatório');
      return;
    }

    if (trimmedName.length < 3) {
      toast.error('Nome deve ter pelo menos 3 caracteres');
      return;
    }

    if (trimmedName.length > 50) {
      toast.error('Nome deve ter no máximo 50 caracteres');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Updating chat room:', { 
        roomId: chatRoom.id,
        name: trimmedName, 
        description: description.trim(), 
        selectedSectors 
      });
      
      await onSubmit(chatRoom.id, trimmedName, description.trim(), selectedSectors);
      onClose();
    } catch (error: any) {
      console.error('Error updating chat room:', error);
      
      if (error?.message) {
        toast.error(`Erro ao atualizar chat: ${error.message}`);
      } else {
        toast.error('Erro inesperado ao atualizar chat. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form
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

  if (!chatRoom) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Chat Customizado</DialogTitle>
          <DialogDescription>
            Modifique as informações do chat "{chatRoom.name}".
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
              maxLength={50}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {name.length}/50 caracteres
            </p>
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
              maxLength={200}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {description.length}/200 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label>Setores com Acesso</Label>
            {sectorsLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Carregando setores...
              </div>
            ) : sectors.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Nenhum setor disponível
              </div>
            ) : (
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
            )}
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
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditChatRoomModal;
