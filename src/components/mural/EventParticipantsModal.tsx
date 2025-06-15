
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, X, Check, Clock } from 'lucide-react';
import { Event, EventParticipant, UserProfile } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';

interface EventParticipantsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onAddParticipant: (eventId: string, userId: string) => Promise<void>;
  onRemoveParticipant: (eventId: string, userId: string) => Promise<void>;
  onFetchParticipants: (eventId: string) => Promise<EventParticipant[]>;
  onFetchAllUsers: () => Promise<UserProfile[]>;
}

const EventParticipantsModal: React.FC<EventParticipantsModalProps> = ({
  event,
  isOpen,
  onClose,
  onAddParticipant,
  onRemoveParticipant,
  onFetchParticipants,
  onFetchAllUsers
}) => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!event) return;
    
    setLoading(true);
    try {
      const [participantsData, usersData] = await Promise.all([
        onFetchParticipants(event.id),
        onFetchAllUsers()
      ]);
      
      setParticipants(participantsData);
      setAllUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && event) {
      loadData();
    }
  }, [isOpen, event]);

  const handleAddParticipant = async () => {
    if (!event || !selectedUserId) return;
    
    await onAddParticipant(event.id, selectedUserId);
    setSelectedUserId('');
    loadData(); // Recarregar dados
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!event) return;
    
    await onRemoveParticipant(event.id, userId);
    loadData(); // Recarregar dados
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Check className="h-3 w-3 mr-1" />Confirmado</Badge>;
      case 'declined':
        return <Badge variant="destructive" className="text-xs"><X className="h-3 w-3 mr-1" />Recusado</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    }
  };

  const availableUsers = allUsers.filter(
    user => !participants.some(p => p.user_id === user.id)
  );

  const isCreator = user && event && user.id === event.created_by;

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participantes - {event.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Adicionar participante (apenas para o criador) */}
          {isCreator && (
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar usuário" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name || user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddParticipant}
                disabled={!selectedUserId || loading}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Lista de participantes */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
              </div>
            ) : participants.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Nenhum participante ainda
                </p>
              </div>
            ) : (
              participants.map((participant) => (
                <div key={participant.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={participant.profiles?.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {participant.profiles?.name?.charAt(0)?.toUpperCase() || 
                         participant.profiles?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {participant.profiles?.name || participant.profiles?.email || 'Usuário'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {participant.profiles?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusBadge(participant.status)}
                    {isCreator && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveParticipant(participant.user_id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventParticipantsModal;
