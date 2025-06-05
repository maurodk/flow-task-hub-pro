
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSectors } from '@/hooks/useSectors';
import { useUserRole } from '@/hooks/useAuth';
import { Building2 } from 'lucide-react';

interface SectorFormProps {
  value: string;
  onChange: (value: string) => void;
}

const SectorForm: React.FC<SectorFormProps> = ({ value, onChange }) => {
  const { sectors, userSectors } = useSectors();
  const { isAdmin } = useUserRole();

  // Se for admin, pode escolher qualquer setor
  // Se não for admin, só pode escolher entre seus setores
  const availableSectors = isAdmin 
    ? sectors 
    : sectors.filter(sector => 
        userSectors.some(us => us.sector_id === sector.id)
      );

  return (
    <div className="space-y-2">
      <Label htmlFor="sector" className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Setor
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um setor (opcional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Nenhum setor</SelectItem>
          {availableSectors.map((sector) => (
            <SelectItem key={sector.id} value={sector.id}>
              {sector.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isAdmin 
          ? "Como administrador, você pode atribuir atividades a qualquer setor"
          : "Você pode atribuir atividades apenas aos setores dos quais faz parte"
        }
      </p>
    </div>
  );
};

export default SectorForm;
