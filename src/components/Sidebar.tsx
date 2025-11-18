import React from 'react';
import { ChevronDown } from 'lucide-react';

const Sidebar: React.FC = () => {
  const FilterSection = ({ 
    title, 
    children 
  }: { 
    title: string; 
    children: React.ReactNode 
  }) => (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  );

  const Checkbox = ({ 
    label, 
    checked = false, 
    disabled = false 
  }: { 
    label: string; 
    checked?: boolean; 
    disabled?: boolean 
  }) => (
    <label className={`flex items-center space-x-2 mb-2 ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
      <input 
        type="checkbox" 
        checked={checked} 
        disabled={disabled}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span className="text-sm">{label}</span>
    </label>
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 h-full overflow-y-auto sidebar-scrollbar">
      {/* Resumen */}
      <FilterSection title="Resumen">
        <div className="relative">
          <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white">
            <option value="participantes">Por Participantes</option>
            <option value="calificaciones">De Calificaciones</option>
            <option value="avance">Por Avance</option>
          </select>
          <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
        </div>
      </FilterSection>

      {/* Mes de Inicio de Curso */}
      <FilterSection title="Mes de Inicio de Curso">
        <div className="max-h-24 overflow-y-auto border border-gray-200 rounded p-2 custom-scrollbar">
          <Checkbox label="Todos" checked={true} />
          <Checkbox label="Enero" checked={true} />
          <Checkbox label="Febrero" />
          <Checkbox label="Marzo" />
          <Checkbox label="Abril" checked={true} />
          <Checkbox label="Mayo" />
          <Checkbox label="Junio" />
          <Checkbox label="Julio" />
          <Checkbox label="Agosto" />
          <Checkbox label="Septiembre" />
          <Checkbox label="Octubre" />
          <Checkbox label="Noviembre" />
          <Checkbox label="Diciembre" />
        </div>
      </FilterSection>

      {/* Modalidad */}
      <FilterSection title="Modalidad">
        <Checkbox label="E-Learning" checked={true} />
        <Checkbox label="Sincrónico" checked={true} />
      </FilterSection>

      {/* Cursos */}
      <FilterSection title="Cursos">
        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded p-2 custom-scrollbar">
          <Checkbox label="Todos" checked={true} />
          <Checkbox label="Diseño Instruccional" checked={true} />
          <Checkbox label="AI Básico" checked={true} />
          <Checkbox label="Word Básico" checked={true} />
          <Checkbox label="Word Avanzado" checked={true} />
          <Checkbox label="Excel Básico" checked={true} />
          <Checkbox label="Excel Avanzado" checked={true} />
          <Checkbox label="Power BI" checked={true} />
          <Checkbox label="AI Modelos LMS" checked={true} />
          <Checkbox label="Introducción a Herramientas" checked={true} />
          <Checkbox label="Fonética del Silencio Parte 1 de 2000" checked={true} />
          <Checkbox label="Ofimática y AI" checked={true} />
          <Checkbox label="Gestión de Proyectos" />
          <Checkbox label="Marketing Digital" />
          <Checkbox label="Contabilidad Básica" />
          <Checkbox label="Recursos Humanos" />
          <Checkbox label="Programación Web" />
          <Checkbox label="Base de Datos" />
          <Checkbox label="Seguridad Informática" />
          <Checkbox label="Redes y Comunicaciones" />
        </div>
      </FilterSection>

      {/* Estado de la Inscripción */}
      <FilterSection title="Estado de la Inscripción">
        <Checkbox label="Inscrito" checked={true} />
        <Checkbox label="Eliminado" />
      </FilterSection>

      {/* Centro de Costo */}
      <FilterSection title="Centro de Costo">
        <Checkbox label="Becado" checked={true} />
        <Checkbox label="Empresa" checked={true} />
        <Checkbox label="Sence" />
        <Checkbox label="Sence / Empresa" />
      </FilterSection>

      {/* Estado del Curso */}
      <FilterSection title="Estado del Curso">
        <Checkbox label="Curso Activo" checked={true} />
        <Checkbox label="Curso Finalizado" />
      </FilterSection>
    </div>
  );
};

export default Sidebar;
