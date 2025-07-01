
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

  const handleValueChange = (newValue: string) => {
    // Converter "none" de volta para string vazia
    onChange(newValue === "none" ? "" : newValue);
  };

  // Converter string vazia para "none" para o componente Select
  const selectValue = value === "" ? "none" : value;

  return (
    <div className="space-y-2">
      <Label htmlFor="sector" className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Setor
      </Label>
      <Select value={selectValue} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione um setor (opcional)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nenhum setor</SelectItem>
          {availableSectors.map((sector) => (
            <SelectItem key={sector.id} value={sector.id}>
              {sector.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {isAdmin 
          ? "Como administrador, você pode atribuir a qualquer setor"
          : availableSectors.length > 0 
            ? "Você pode atribuir apenas aos setores dos quais faz parte"
            : "Você não tem acesso a nenhum setor específico"
        }
      </p>
    </div>
  );
};

export default SectorForm;
