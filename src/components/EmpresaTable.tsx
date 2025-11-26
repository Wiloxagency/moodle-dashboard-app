import React, { useMemo, useState } from 'react';
import type { EmpresaFormData } from './EmpresaForm';

interface Props {
  data: EmpresaFormData[];
  onNew?: () => void;
  onEdit?: (item: EmpresaFormData, index: number) => void;
}

type SortKey =
  | 'code'
  | 'nombre'
  | 'holding'
  | 'rut'
  | 'nombre_responsable'
  | 'email_responsable'
  | 'telefono_1'
  | 'telefono_2'
  | 'email_empresa'
  | 'status';

const EmpresaTable: React.FC<Props> = ({ data, onNew, onEdit }) => {
  const [filter, setFilter] = useState('');
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('nombre');
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

  const filtered = useMemo(() => {
    if (!filter.trim()) return data;
    const q = filter.toLowerCase();
    return data.filter(r =>
      (r.nombre || '').toLowerCase().includes(q) ||
      (r.holding || '').toLowerCase().includes(q) ||
      (r.rut || '').toLowerCase().includes(q) ||
      (r.nombreResponsable || '').toLowerCase().includes(q) ||
      (r.emailResponsable || '').toLowerCase().includes(q) ||
      (r.emailEmpresa || '').toLowerCase().includes(q)
    );
  }, [data, filter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const va = (a as any)[sortKey]?.toString()?.toLowerCase?.() ?? '';
      const vb = (b as any)[sortKey]?.toString()?.toLowerCase?.() ?? '';
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageRows = sorted.slice(start, end);

  const SortIcon = ({ col }: { col: SortKey }) => (
    sortKey !== col ? <span className="inline-block ml-1 text-gray-300">⇅</span> : (
      sortDir === 'asc' ? <span className="inline-block ml-1 text-gray-500">▲</span> : <span className="inline-block ml-1 text-gray-500">▼</span>
    )
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Empresas</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              placeholder="Filtrar empresas..."
              className="px-3 py-2 border rounded-md text-sm"
            />
            <select
              value={perPage}
              onChange={e => { setPerPage(parseInt(e.target.value)); setPage(1); }}
              className="px-2 py-2 border rounded-md text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <button
              onClick={onNew}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Nueva Empresa
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('code')}>Code <SortIcon col="code" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('nombre')}>Nombre <SortIcon col="nombre" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('holding')}>Holding <SortIcon col="holding" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('rut')}>RUT <SortIcon col="rut" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('nombreResponsable')}>Responsable <SortIcon col="nombreResponsable" /></th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Responsable</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfonos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageRows.map((r, idx) => {
                const rowNumber = start + idx + 1;
                return (
                  <tr
                    key={`${r.rut || r.nombre}-${rowNumber}`}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onEdit && onEdit(r, rowNumber - 1)}
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500 text-center">{rowNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{(r as any).code ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.nombre}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.holding || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.rut || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.nombre_responsable || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.email_responsable || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{[r.telefono_1, r.telefono_2].filter(Boolean).join(' / ') || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.email_empresa || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{r.status}</td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500 text-center" colSpan={9}>
                    Sin empresas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{total === 0 ? 0 : start + 1}</span> a <span className="font-medium">{end}</span> de <span className="font-medium">{total}</span> empresas — Página {page} de {totalPages}
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

export default EmpresaTable;