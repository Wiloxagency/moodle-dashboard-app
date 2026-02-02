import React, { useEffect, useMemo, useState } from 'react';
import { Users, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Inscripcion } from '../services/inscripciones';

interface Props {
  data: Inscripcion[];
  participantCounts?: Record<string, number>;
  onNew?: () => void;
  onEdit?: (item: Inscripcion) => void;
  empresaByCode?: Record<number, string>;
}

type SortKey =
  | 'secuencial'
  | 'numeroInscripcion'
  | 'correlativo'
  | 'codigoSence'
  | 'ordenCompra'
  | 'idSence'
  | 'idMoodle'
  | 'empresa'
  | 'nombreCurso'
  | 'modalidad'
  | 'inicio'
  | 'termino'
  | 'ejecutivo'
  | 'numAlumnosInscritos'
  | 'valorInicial'

const InscripcionesTable: React.FC<Props> = ({ data, participantCounts = {}, onNew, onEdit, empresaByCode = {} }) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('numeroInscripcion');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const requestSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const getModalidadColor = (modalidad: string) => {
    switch (modalidad && modalidad.toLowerCase()) {
      case 'e-learning':
        return 'bg-blue-100 text-blue-800';
      case 'sincrónico':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number | undefined) =>
    (value ?? 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString('es-CL') : '-';

  const getEmpresaLabel = (empresa: any): string => {
    if (empresa === undefined || empresa === null || empresa === '') return '';
    if (typeof empresa === 'number' && Number.isFinite(empresa)) {
      return empresaByCode[empresa] || String(empresa);
    }
    const raw = String(empresa).trim();
    const num = Number(raw);
    if (Number.isFinite(num)) {
      return empresaByCode[num] || raw;
    }
    return raw;
  };

  // Filtering
  const filtered = useMemo(() => {
    if (!filter.trim()) return data;
    const q = filter.toLowerCase();
    return data.filter(r =>
      String(r.numeroInscripcion || '').toLowerCase().includes(q) ||
      String(r.correlativo || '').toLowerCase().includes(q) ||
      (r.codigoSence || '').toLowerCase().includes(q) ||
      getEmpresaLabel(r.empresa).toLowerCase().includes(q) ||
      String(r.empresa || '').toLowerCase().includes(q) ||
      (r.nombreCurso || '').toLowerCase().includes(q) ||
      (r.ejecutivo || '').toLowerCase().includes(q) ||
      (r.idMoodle || '').toLowerCase().includes(q) ||
      (r.idSence || '').toLowerCase().includes(q)
    );
  }, [data, filter, empresaByCode]);

  // Sorting
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const get = (key: SortKey) => {
        switch (key) {
          case 'secuencial': return 0; // handled by index
                    case 'valorInicial': return a.valorInicial ?? 0;
          case 'inicio': return new Date(a.inicio).getTime() || 0;
          case 'termino': return a.termino ? new Date(a.termino).getTime() || 0 : 0;
          case 'numeroInscripcion': return parseInt(a.numeroInscripcion as any, 10) || 0;
          case 'correlativo': return a.correlativo || 0;
          case 'empresa': return getEmpresaLabel(a.empresa).toLowerCase();
          default: return (a as any)[key]?.toString()?.toLowerCase?.() ?? '';
        }
      };
      const getB = (key: SortKey) => {
        switch (key) {
          case 'secuencial': return 0;
                    case 'numAlumnosInscritos': return (participantCounts[b.numeroInscripcion] ?? b.numAlumnosInscritos);
          case 'inicio': return new Date(b.inicio).getTime() || 0;
          case 'termino': return b.termino ? new Date(b.termino).getTime() || 0 : 0;
          case 'numeroInscripcion': return parseInt(b.numeroInscripcion as any, 10) || 0;
          case 'correlativo': return b.correlativo || 0;
          case 'empresa': return getEmpresaLabel(b.empresa).toLowerCase();
          default: return (b as any)[key]?.toString()?.toLowerCase?.() ?? '';
        }
      };
      const va = get(sortKey);
      const vb = getB(sortKey);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir, empresaByCode]);

  // Pagination
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageRows = sorted.slice(start, end);

  const SortIcon = ({ col }: { col: SortKey }) => (
    sortKey !== col ? <ArrowUpDown className="inline w-3.5 h-3.5 ml-1 text-gray-400" /> : (sortDir === 'asc' ? <ChevronUp className="inline w-3.5 h-3.5 ml-1 text-gray-500" /> : <ChevronDown className="inline w-3.5 h-3.5 ml-1 text-gray-500" />)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Inscripciones</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} placeholder="Filtrar..." className="px-3 py-2 border rounded-md text-sm" />
            <select value={perPage} onChange={e => { setPerPage(parseInt(e.target.value)); setPage(1); }} className="px-2 py-2 border rounded-md text-sm">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <button onClick={onNew} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Nueva Inscripción
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="relative max-h-[calc(100vh-220px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left min-w-[145px] text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('numeroInscripcion')}>N° Inscripción <SortIcon col="numeroInscripcion" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('correlativo')}>N° Correlativo <SortIcon col="correlativo" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('codigoSence')}>Código Sence <SortIcon col="codigoSence" /></th>
              <th className="px-4 py-3 text-left min-w-[110px] text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('ordenCompra')}>Orden de Compra <SortIcon col="ordenCompra" /></th>
              <th className="px-4 py-3 text-left min-w-[110px] text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('idSence')}>ID Sence <SortIcon col="idSence" /></th>
              <th className="px-4 py-3 text-left min-w-[130px] text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('idMoodle')}>ID Moodle <SortIcon col="idMoodle" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('empresa')}>Empresa <SortIcon col="empresa" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('nombreCurso')}>Nombre del Curso <SortIcon col="nombreCurso" /></th>
              <th className="px-4 py-3 text-left min-w-[140px] text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('modalidad')}>Modalidad <SortIcon col="modalidad" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('inicio')}>Inicio <SortIcon col="inicio" /></th>
              <th className="px-4 py-3 text-left min-w-[120px] text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('termino')}>Fecha Final <SortIcon col="termino" /></th>
              <th className="px-4 py-3 text-left min-w-[120px] text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('ejecutivo')}>Ejecutivo <SortIcon col="ejecutivo" /></th>
              <th className="px-4 py-3 text-right min-w-[130px] text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('numAlumnosInscritos')}>Num Alumnos Inscritos <SortIcon col="numAlumnosInscritos" /></th>
              <th className="px-4 py-3 text-right min-w-[110px] text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('valorInicial')}>Valor Inicial <SortIcon col="valorInicial" /></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comentario</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pageRows.map((r, idx) => {
              const rowNumber = start + idx + 1;
              return (
                <tr onClick={() => onEdit && onEdit(r)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{rowNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[145px]">{r.numeroInscripcion}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.correlativo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.codigoSence || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[110px]">{r.ordenCompra || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[110px]">{r.idSence || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[130px]">{r.idMoodle || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-[200px] truncate" title={getEmpresaLabel(r.empresa)}>{getEmpresaLabel(r.empresa)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-[300px] truncate" title={r.nombreCurso}>{r.nombreCurso}</td>
                  <td className="px-4 py-3 whitespace-nowrap min-w-[120px]">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getModalidadColor(r.modalidad)}`}>
                      {r.modalidad}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{formatDate(r.inicio)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[120px]">{formatDate(r.termino)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 min-w-[120px]">{r.ejecutivo}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 min-w-[130px]">{participantCounts[r.numeroInscripcion] ?? r.numAlumnosInscritos}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 min-w-[110px]">{formatCurrency(r.valorInicial)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 max-w-[320px] truncate" title={r.comentarios}>{r.comentarios || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button title="Alumnos" onClick={() => navigate(`/participantes/${encodeURIComponent(r.numeroInscripcion)}`)} className="p-1 rounded hover:bg-gray-50 text-gray-600" aria-label="Alumnos">
                        <Users className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          </table>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{total === 0 ? 0 : start + 1}</span> a <span className="font-medium">{end}</span> de <span className="font-medium">{total}</span> inscripciones — Página {page} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Anterior</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscripcionesTable;
