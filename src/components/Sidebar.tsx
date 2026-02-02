import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SidebarProps {
  months?: string[];
  selectedMonths?: string[];
  onToggleMonth?: (month: string) => void;
  onToggleAllMonths?: () => void;
  modalidades?: string[];
  selectedModalidades?: string[];
  onToggleModalidad?: (modalidad: string) => void;
  cursos?: string[];
  selectedCursos?: string[];
  onToggleCurso?: (curso: string) => void;
  onToggleAllCursos?: () => void;
  estadoCurso?: { active: boolean; finalizado: boolean };
  onToggleEstadoCurso?: (key: 'active' | 'finalizado') => void;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, children }) => (
  <div className="mb-6">
    <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
    {children}
  </div>
);

interface CheckboxProps {
  label: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: () => void;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked = false, disabled = false, onChange }) => (
  <label className={`flex items-center space-x-2 py-1 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      readOnly={!onChange}
      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <span className="text-sm text-gray-600">{label}</span>
  </label>
);

const Sidebar: React.FC<SidebarProps> = ({
  months = [],
  selectedMonths = [],
  onToggleMonth = () => {},
  onToggleAllMonths = () => {},
  modalidades = [],
  selectedModalidades = [],
  onToggleModalidad = () => {},
  cursos = [],
  selectedCursos = [],
  onToggleCurso = () => {},
  onToggleAllCursos = () => {},
  estadoCurso = { active: true, finalizado: false },
  onToggleEstadoCurso = () => {},
}) => {
  const allMonthsSelected = months.length > 0 && selectedMonths.length === months.length;
  const allCursosSelected = cursos.length > 0 && selectedCursos.length === cursos.length;

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 h-full overflow-y-auto sidebar-scrollbar">
      {/* Resumen */}
      <FilterSection title="Resumen">
        <div className="relative">
          <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white appearance-none">
            <option value="participantes">Por Participantes</option>
            <option value="calificaciones">De Calificaciones</option>
            <option value="avance">Por Avance</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </FilterSection>

      {/* Mes de Inicio de Curso */}
      <FilterSection title="Mes de Inicio de Curso">
        <div className="max-h-40 overflow-y-auto custom-scrollbar">
          <Checkbox label="Todos" checked={allMonthsSelected} onChange={onToggleAllMonths} />
          {months.map((month) => (
            <Checkbox
              key={month}
              label={month}
              checked={selectedMonths.includes(month)}
              onChange={() => onToggleMonth(month)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Modalidad */}
      <FilterSection title="Modalidad">
        <div className="max-h-32 overflow-y-auto custom-scrollbar">
          {modalidades.map((m) => (
            <Checkbox
              key={m}
              label={m}
              checked={selectedModalidades.includes(m)}
              onChange={() => onToggleModalidad(m)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Cursos */}
      <FilterSection title="Cursos">
        <div className="max-h-40 overflow-y-auto custom-scrollbar">
          <Checkbox label="Todos" checked={allCursosSelected} onChange={onToggleAllCursos} />
          {cursos.map((course) => (
            <Checkbox
              key={course}
              label={course}
              checked={selectedCursos.includes(course)}
              onChange={() => onToggleCurso(course)}
            />
          ))}
        </div>
      </FilterSection>

      {/* Estado de la Inscripción */}
      <FilterSection title="Estado de la Inscripción">
        <Checkbox label="Inscrito" checked />
        <Checkbox label="Eliminado" checked={false} />
      </FilterSection>

      {/* Centro de Costo */}
      <FilterSection title="Centro de Costo">
        <Checkbox label="Becado" checked />
        <Checkbox label="Empresa" checked />
      </FilterSection>

      {/* Estado del Curso */}
      <FilterSection title="Estado del Curso">
        <Checkbox
          label="Curso Activo"
          checked={estadoCurso.active}
          onChange={() => onToggleEstadoCurso('active')}
        />
        <Checkbox
          label="Curso Finalizado"
          checked={estadoCurso.finalizado}
          onChange={() => onToggleEstadoCurso('finalizado')}
        />
      </FilterSection>
    </div>
  );
};

export default Sidebar;
