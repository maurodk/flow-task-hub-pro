
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ChatRoom } from '@/types/chatRoom';
import { fetchChatRoomsWithSectors } from '@/services/chatRoomService';
import {
  createChatRoom as createChatRoomOperation,
  updateChatRoom as updateChatRoomOperation,
  archiveChatRoom as archiveChatRoomOperation,
  restoreChatRoom as restoreChatRoomOperation,
  deleteChatRoom as deleteChatRoomOperation
} from '@/services/chatRoomOperations';

export const useChatRooms = () => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [archivedChatRooms, setArchivedChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingArchived, setLoadingArchived] = useState(false);

  const fetchChatRooms = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Starting to fetch active chat rooms...');
      const activeChatRooms = await fetchChatRoomsWithSectors(true, user.id);
      console.log('Setting active chat rooms:', activeChatRooms);
      setChatRooms(activeChatRooms);
    } catch (error) {
      console.error('Error fetching active chat rooms:', error);
      toast.error('Erro ao carregar chats ativos');
      setChatRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedChatRooms = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingArchived(true);
      const archived = await fetchChatRoomsWithSectors(false, user.id);
      setArchivedChatRooms(archived);
    } catch (error) {
      console.error('Error fetching archived chat rooms:', error);
      toast.error('Erro ao carregar chats arquivados');
      setArchivedChatRooms([]);
    } finally {
      setLoadingArchived(false);
    }
  };

  const createChatRoom = async (name: string, description: string, sectorIds: string[]) => {
    if (!user?.id) return;
    
    try {
      await createChatRoomOperation(name, description, sectorIds, user.id);
      console.log('Refreshing chat rooms after creation...');
      await fetchChatRooms();
    } catch (error) {
      // Error already handled in operation
      throw error;
    }
  };

  const updateChatRoom = async (roomId: string, name: string, description: string, sectorIds: string[]) => {
    if (!user?.id) return;
    
    try {
      await updateChatRoomOperation(roomId, name, description, sectorIds, user.id);
      console.log('Refreshing chat rooms after update...');
      await fetchChatRooms();
    } catch (error) {
      // Error already handled in operation
    }
  };

  const archiveChatRoom = async (roomId: string) => {
    if (!user?.id) return;
    
    try {
      await archiveChatRoomOperation(roomId, user.id);
      console.log('Refreshing chat rooms after archiving...');
      await fetchChatRooms();
      await fetchArchivedChatRooms();
    } catch (error) {
      // Error already handled in operation
    }
  };

  const restoreChatRoom = async (roomId: string) => {
    if (!user?.id) return;
    
    try {
      await restoreChatRoomOperation(roomId, user.id);
      console.log('Refreshing chat rooms after restoration...');
      await fetchChatRooms();
      await fetchArchivedChatRooms();
    } catch (error) {
      // Error already handled in operation
    }
  };

  const deleteChatRoom = async (roomId: string) => {
    if (!user?.id) return;
    
    try {
      await deleteChatRoomOperation(roomId, user.id);
      console.log('Refreshing chat rooms after deletion...');
      await fetchChatRooms();
      await fetchArchivedChatRooms();
    } catch (error) {
      // Error already handled in operation
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [user?.id]);

  return {
    chatRooms,
    archivedChatRooms,
    loading,
    loadingArchived,
    createChatRoom,
    updateChatRoom,
    archiveChatRoom,
    restoreChatRoom,
    deleteChatRoom,
    fetchChatRooms,
    fetchArchivedChatRooms
  };
};

// Re-export the ChatRoom type for backward compatibility
export type { ChatRoom };
