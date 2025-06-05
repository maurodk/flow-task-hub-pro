
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSectors } from '@/hooks/useSectors';
import { useUserRole } from '@/hooks/useAuth';
import { Building2, Filter } from 'lucide-react';

interface SectorFilterProps {
  value: string;
  onChange: (value: string) => void;
  showLabel?: boolean;
}

const SectorFilter: React.FC<SectorFilterProps> = ({ 
  value, 
  onChange, 
  showLabel = true 
}) => {
  const { sectors, userSectors } = useSectors();
  const { isAdmin } = useUserRole();

  // Se for admin, pode ver todos os setores
  // Se não for admin, só pode ver seus setores
  const availableSectors = isAdmin 
    ? sectors 
    : sectors.filter(sector => 
        userSectors.some(us => us.sector_id === sector.id)
      );

  return (
    <div className="space-y-2">
      {showLabel && (
        <label className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filtrar por Setor
        </label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Todos os setores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Todos os setores
            </div>
          </SelectItem>
          {availableSectors.map((sector) => (
            <SelectItem key={sector.id} value={sector.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                {sector.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SectorFilter;
