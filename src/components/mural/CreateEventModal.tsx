
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, eventDate: string, eventTime: string) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !selectedDate || !selectedTime) {
      return;
    }

    setIsSubmitting(true);
    
    const eventDate = format(selectedDate, 'yyyy-MM-dd');
    await onSubmit(title.trim(), description.trim(), eventDate, selectedTime);
    
    // Reset form
    setTitle('');
    setDescription('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedDate(undefined);
    setSelectedTime('');
    onClose();
  };

  const handleTimeChange = (hour: string, minute: string) => {
    setSelectedTime(`${hour}:${minute}`);
  };

  const formatTimeDisplay = (time: string) => {
    if (!time) return 'Selecionar horário';
    return time;
  };

  const [selectedHour, selectedMinute] = selectedTime.split(':');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Evento</DialogTitle>
          <DialogDescription>
            Preencha as informações do evento que você deseja criar.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Nome do evento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva o evento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                    ) : (
                      <span>Selecionar data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Horário *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{formatTimeDisplay(selectedTime)}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4">
                  <div className="flex space-x-2">
                    <div className="flex flex-col space-y-2">
                      <Label className="text-sm font-medium">Hora</Label>
                      <Select value={selectedHour} onValueChange={(hour) => handleTimeChange(hour, selectedMinute || '00')}>
                        <SelectTrigger className="w-16">
                          <SelectValue placeholder="--" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Label className="text-sm font-medium">Min</Label>
                      <Select value={selectedMinute} onValueChange={(minute) => handleTimeChange(selectedHour || '00', minute)}>
                        <SelectTrigger className="w-16">
                          <SelectValue placeholder="--" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 60 }, (_, i) => (
                            <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !title.trim() || !selectedDate || !selectedTime}
            >
              {isSubmitting ? 'Criando...' : 'Criar Evento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;
