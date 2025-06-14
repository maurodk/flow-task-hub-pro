
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Plus, Clock, Trash2, Edit } from 'lucide-react';
import { useEvents, Event } from '@/hooks/useEvents';
import CreateEventModal from './CreateEventModal';
import EditEventModal from './EditEventModal';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

const EventsSection: React.FC = () => {
  const { user } = useAuth();
  const { events, loading, createEvent, updateEvent, deleteEvent } = useEvents();
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const getDateBadge = (dateString: string) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return <Badge variant="destructive" className="text-xs">Hoje</Badge>;
    } else if (isTomorrow(date)) {
      return <Badge variant="secondary" className="text-xs">Amanhã</Badge>;
    }
    return null;
  };

  const truncateDescription = (description: string, maxLength = 50) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const handleEventClick = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  };

  const handleEditEvent = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
  };

  const handleDeleteEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este evento?')) {
      await deleteEvent(eventId);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Calendar className="h-5 w-5" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Calendar className="h-5 w-5" />
              Próximos Eventos
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCreateEventOpen(true)}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Nenhum evento próximo encontrado
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateEventOpen(true)}
                className="mt-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Criar primeiro evento
              </Button>
            </div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="border-l-4 border-blue-500 pl-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 p-2 rounded-r transition-colors group"
                onClick={() => handleEventClick(event.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {event.title}
                      </h4>
                      {getDateBadge(event.event_date)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300 mb-2">
                      <span>{format(parseISO(event.event_date), "dd 'de' MMMM", { locale: ptBR })}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {event.event_time}
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {expandedEvent === event.id 
                          ? event.description 
                          : truncateDescription(event.description)
                        }
                      </p>
                    )}

                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.attendees_count} participantes
                    </p>
                  </div>

                  {user && user.id === event.created_by && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleEditEvent(event, e)}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                        title="Editar evento"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDeleteEvent(event.id, e)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Deletar evento"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CreateEventModal
        isOpen={createEventOpen}
        onClose={() => setCreateEventOpen(false)}
        onSubmit={createEvent}
      />

      <EditEventModal
        event={editingEvent}
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        onSubmit={updateEvent}
      />
    </>
  );
};

export default EventsSection;
