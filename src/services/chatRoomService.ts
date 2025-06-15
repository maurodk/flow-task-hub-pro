
import { supabase } from '@/integrations/supabase/client';
import { ChatRoom } from '@/types/chatRoom';

export const fetchChatRoomsWithSectors = async (isActive: boolean, userId: string): Promise<ChatRoom[]> => {
  if (!userId) {
    console.log('No user found, skipping chat rooms fetch');
    return [];
  }

  try {
    console.log(`Fetching ${isActive ? 'active' : 'archived'} chat rooms for user:`, userId);
    
    // Simplificar a query inicial - buscar todos os chat rooms ativos/arquivados
    const { data: roomsData, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('is_active', isActive)
      .order('created_at', { ascending: false });

    if (roomsError) {
      console.error(`Error fetching ${isActive ? 'active' : 'archived'} chat rooms:`, roomsError);
      throw roomsError;
    }

    console.log(`${isActive ? 'Active' : 'Archived'} chat rooms data fetched:`, roomsData);

    if (!roomsData || roomsData.length === 0) {
      console.log(`No ${isActive ? 'active' : 'archived'} chat rooms found`);
      return [];
    }

    // Agora buscar os setores para cada chat room e aplicar filtros de acesso
    const roomsWithSectors = await Promise.all(
      roomsData.map(async (room) => {
        try {
          // Buscar setores do chat room
          const { data: sectorsData, error: sectorsError } = await supabase
            .from('chat_room_sectors')
            .select(`
              sector:sectors(
                id,
                name
              )
            `)
            .eq('chat_room_id', room.id);

          if (sectorsError) {
            console.error(`Error fetching sectors for room ${room.id}:`, sectorsError);
          }

          const sectors = sectorsData?.map((crs: any) => crs.sector).filter(Boolean) || [];
          console.log(`Room ${room.name} has sectors:`, sectors);

          // Verificar se o usuário tem acesso ao chat room
          const { data: hasAccess, error: accessError } = await supabase
            .rpc('user_can_access_chat_room', { 
              room_id: room.id, 
              user_id: userId 
            });

          if (accessError) {
            console.error(`Error checking access for room ${room.id}:`, accessError);
            // Em caso de erro, permitir acesso (fallback)
            return {
              ...room,
              sectors
            };
          }

          console.log(`User has access to room ${room.name}:`, hasAccess);

          // Só incluir o chat room se o usuário tiver acesso
          if (hasAccess) {
            return {
              ...room,
              sectors
            };
          } else {
            console.log(`User does not have access to room ${room.name}, excluding from list`);
            return null;
          }
        } catch (error) {
          console.error(`Error processing room ${room.id}:`, error);
          // Em caso de erro, incluir o chat room (fallback)
          return {
            ...room,
            sectors: []
          };
        }
      })
    );

    // Filtrar resultados nulos (chats sem acesso) e retornar
    const accessibleRooms = roomsWithSectors.filter(room => room !== null) as ChatRoom[];
    console.log(`Final ${isActive ? 'active' : 'archived'} chat rooms with access:`, accessibleRooms);
    
    return accessibleRooms;
  } catch (error) {
    console.error(`Unexpected error fetching ${isActive ? 'active' : 'archived'} chat rooms:`, error);
    throw error;
  }
};
