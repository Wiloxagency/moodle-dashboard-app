import React, { useMemo, useState } from 'react';
import type { Modalidad } from '../services/modalidades';

interface Props {
  data: Modalidad[];
  onNew?: () => void;
  onEdit?: (item: Modalidad, index: number) => void;
}

// aquí simplemente listamos una fila por combinación de modalidades

const ModalidadTable: React.FC<Props> = ({ data, onNew, onEdit }) => {
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => data, [data]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const end = Math.min(start + perPage, total);
  const pageRows = sorted.slice(start, end);

  const getLabels = (m: Modalidad) => {
    const labels: string[] = [];
    if (m.sincronico) labels.push('Sincrónico');
    if (m.asincronico) labels.push('Asincrónico');
    if (m.sincronico_online) labels.push('Sincrónico On-line');
    if (m.sincronico_presencial_moodle) labels.push('Sincrónico Presencial Moodle');
    if (m.sincronico_presencial_no_moodle) labels.push('Sincrónico Presencial No-Moodle');
    return labels.join(' | ') || '-';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Modalidad</h2>
          <div className="flex flex-wrap items-center gap-2">
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
              Nueva Modalidad
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="relative max-h-[calc(100vh-220px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Configuración de Modalidad</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pageRows.map((r, idx) => {
                const rowNumber = start + idx + 1;
                return (
                  <tr
                    key={rowNumber}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onEdit && onEdit(r, rowNumber - 1)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{(r as any).code ?? '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{getLabels(r)}</td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-500 text-center" colSpan={2}>
                    Sin configuraciones de modalidad
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
            Mostrando <span className="font-medium">{total === 0 ? 0 : start + 1}</span> a <span className="font-medium">{end}</span> de <span className="font-medium">{total}</span> configuraciones — Página {page} de {totalPages}
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

export default ModalidadTable;