
import { supabase } from '@/integrations/supabase/client';
import { ChatRoom } from '@/types/chatRoom';

export const fetchChatRoomsWithSectors = async (isActive: boolean, userId: string): Promise<ChatRoom[]> => {
  if (!userId) {
    console.log('No user found, skipping chat rooms fetch');
    return [];
  }

  try {
    console.log(`Fetching ${isActive ? 'active' : 'archived'} chat rooms for user:`, userId);
    
    // Primeiro, buscar os setores do usuário
    const { data: userSectorsData, error: userSectorsError } = await supabase
      .from('user_sectors')
      .select('sector_id')
      .eq('user_id', userId);

    if (userSectorsError) {
      console.error('Error fetching user sectors:', userSectorsError);
      throw userSectorsError;
    }

    const userSectorIds = userSectorsData?.map(us => us.sector_id) || [];
    console.log('User sector IDs:', userSectorIds);

    // Verificar se o usuário é admin
    const { data: isAdminData, error: adminError } = await supabase
      .rpc('is_admin', { user_id: userId });

    if (adminError) {
      console.error('Error checking admin status:', adminError);
    }

    const isAdmin = isAdminData || false;
    console.log('User is admin:', isAdmin);

    // Buscar todos os chat rooms ativos/arquivados
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

    // Processar cada chat room e aplicar regras de acesso
    const accessibleRooms: ChatRoom[] = [];

    for (const room of roomsData) {
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
          continue;
        }

        const sectors = sectorsData?.map((crs: any) => crs.sector).filter(Boolean) || [];
        console.log(`Room ${room.name} has sectors:`, sectors.map(s => s.name));
        
        // Regras de acesso:
        // 1. Se o usuário é admin, tem acesso a todos os chats
        // 2. Se o usuário é o criador do chat, tem acesso
        // 3. Se o chat não tem setores vinculados, é público (todos têm acesso)
        // 4. Se o chat tem setores, verificar se o usuário pertence a pelo menos um deles
        
        let hasAccess = false;

        if (isAdmin) {
          hasAccess = true;
          console.log(`Admin access granted to room ${room.name}`);
        } else if (room.created_by === userId) {
          hasAccess = true;
          console.log(`Creator access granted to room ${room.name}`);
        } else if (sectors.length === 0) {
          hasAccess = true;
          console.log(`Public room access granted to ${room.name}`);
        } else {
          // Verificar se o usuário pertence a algum setor do chat room
          const sectorIds = sectors.map(s => s.id);
          const hasCommonSector = sectorIds.some(sectorId => userSectorIds.includes(sectorId));
          
          if (hasCommonSector) {
            hasAccess = true;
            console.log(`Sector-based access granted to room ${room.name}`);
          } else {
            console.log(`Access denied to room ${room.name} - user not in required sectors`);
          }
        }

        if (hasAccess) {
          accessibleRooms.push({
            ...room,
            sectors
          });
        }
      } catch (error) {
        console.error(`Error processing room ${room.id}:`, error);
        // Em caso de erro, não incluir o chat room por segurança
        continue;
      }
    }

    console.log(`Final ${isActive ? 'active' : 'archived'} accessible chat rooms:`, accessibleRooms.map(r => r.name));
    return accessibleRooms;
  } catch (error) {
    console.error(`Unexpected error fetching ${isActive ? 'active' : 'archived'} chat rooms:`, error);
    throw error;
  }
};
