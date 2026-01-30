import React, { useEffect, useMemo, useState } from 'react';
import config from '../config/environment';
import inscripcionesApi from '../services/inscripciones';
import { participantesApi, type Participante } from '../services/participantes';

// Tipos de métricas
const emptyMetrics = () => ({
  becados: 0,
  empresa: 0,
  sence: 0,
  senceEmpresa: 0,
});

type MetricKey = keyof ReturnType<typeof emptyMetrics>;
type Metrics = ReturnType<typeof emptyMetrics>;

type GradeRow = {
  numeroInscripcion: number;
  RutAlumno: string;
  PorcentajeAvance: number | null;
};

type GradesResponse = {
  success: boolean;
  data?: GradeRow[];
  error?: { message?: string };
};

const normalizeRut = (v?: string) => (v || '').replace(/[.-]/g, '').toLowerCase();

const classifyParticipant = (p: Participante): MetricKey => {
  const vc = p.valorCobrado ?? 0;
  const f = p.franquiciaPorcentaje ?? 0;
  if (vc === 0) return 'becados';
  if (f === 100) return 'sence';
  if (f === 0) return 'empresa';
  return 'senceEmpresa';
};

const aggregateMetrics = (participants: Participante[]): Metrics =>
  participants.reduce((acc, p) => {
    acc[classifyParticipant(p)] += 1;
    return acc;
  }, emptyMetrics());

const StatisticsCards: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalMetrics, setTotalMetrics] = useState<Metrics>(emptyMetrics());
  const [zeroAdvanceMetrics, setZeroAdvanceMetrics] = useState<Metrics>(emptyMetrics());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const inscripciones = await inscripcionesApi.list();
        const ids = inscripciones
          .map(i => i.numeroInscripcion)
          .filter((n): n is number => n !== null && n !== undefined);

        // Fetch participantes and grades per inscripción in parallel
        const participantesByInscripcion = await Promise.all(ids.map(async (id) => {
          try {
            const list = await participantesApi.listByInscripcion(id);
            return { id, participantes: list };
          } catch (e: unknown) {
            console.error('Error cargando participantes', id, e);
            return { id, participantes: [] as Participante[] };
          }
        }));

        const gradesByInscripcion = await Promise.all(ids.map(async (id) => {
          try {
            const url = `${config.apiBaseUrl}/participantes/${encodeURIComponent(id)}/grades-numeric`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json: GradesResponse = await res.json();
            if (!json.success) throw new Error(json.error?.message || 'API error');
            const data = Array.isArray(json.data) ? json.data : [];
            return { id, grades: data };
          } catch (e: unknown) {
            console.error('Error cargando grades-numeric', id, e);
            return { id, grades: [] as GradeRow[] };
          }
        }));

        // Totales
        const allParticipants = participantesByInscripcion.flatMap(p => p.participantes);
        const totals = aggregateMetrics(allParticipants);

        // Participantes con 0% avance (PorcentajeAvance 0 o null)
        const zeroAdvanceMap = new Map<number, Set<string>>();
        for (const { id, grades } of gradesByInscripcion) {
          const set = new Set<string>();
          grades.forEach(g => {
            if (g.PorcentajeAvance === null || g.PorcentajeAvance === 0) {
              set.add(`${id}-${normalizeRut(g.RutAlumno)}`);
            }
          });
          zeroAdvanceMap.set(id, set);
        }

        const zeroAdvanceParticipants: Participante[] = [];
        for (const { id, participantes } of participantesByInscripcion) {
          const set = zeroAdvanceMap.get(id);
          if (!set) continue;
          for (const p of participantes) {
            if (set.has(`${id}-${normalizeRut(p.rut)}`)) zeroAdvanceParticipants.push(p);
          }
        }

        const zeroMetrics = aggregateMetrics(zeroAdvanceParticipants);

        if (!cancelled) {
          setTotalMetrics(totals);
          setZeroAdvanceMetrics(zeroMetrics);
          setLoading(false);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error cargando métricas');
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const totalCount = useMemo(() => Object.values(totalMetrics).reduce((a, b) => a + b, 0), [totalMetrics]);
  const zeroCount = useMemo(() => Object.values(zeroAdvanceMetrics).reduce((a, b) => a + b, 0), [zeroAdvanceMetrics]);

  const cardsSpec: Array<{ key: MetricKey; title: string; color: string }> = [
    { key: 'becados', title: 'Becados', color: 'bg-blue-500' },
    { key: 'empresa', title: 'Empresa', color: 'bg-green-600' },
    { key: 'sence', title: 'Sence', color: 'bg-indigo-600' },
    { key: 'senceEmpresa', title: 'Sence + Empresa', color: 'bg-teal-600' },
  ];

  const StatCard = ({ 
    title, 
    count, 
    percentage, 
    bgColor, 
    isTotal = false 
  }: {
    title: string;
    count: number;
    percentage?: number;
    bgColor: string;
    isTotal?: boolean;
  }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden`}>
      <div className="p-4">
        <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
        <div className="flex items-end justify-between">
          <div className={`${isTotal ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900`}>{count}</div>
          {percentage !== undefined && !isTotal && (
            <div className="text-sm text-gray-600 flex items-center">
              <div className="w-px h-6 bg-gray-300 mr-2"></div>
              <span>{percentage}%</span>
            </div>
          )}
        </div>
      </div>
      {!isTotal && (
        <div className="h-1 bg-gray-200">
          <div 
            className={`h-full ${bgColor}`} 
            style={{ width: `${percentage ?? 0}%` }}
          ></div>
        </div>
      )}
      {isTotal && (
        <div className={`h-1 ${bgColor}`}></div>
      )}
    </div>
  );

  const renderSection = (title: string, metrics: Metrics, total: number, totalTitle: string) => (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cardsSpec.map(card => (
          <StatCard
            key={card.key}
            title={card.title}
            count={metrics[card.key]}
            percentage={total > 0 ? Math.round((metrics[card.key] / total) * 100) : 0}
            bgColor={card.color}
          />
        ))}
        <StatCard
          title={totalTitle}
          count={total}
          bgColor="bg-gray-800"
          isTotal
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Cargando métricas...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-red-600 text-sm">{error}</div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {renderSection('Total Participantes', totalMetrics, totalCount, 'Total Alumnos')}
      {renderSection('Participantes con 0% de Avance', zeroAdvanceMetrics, zeroCount, 'Alumnos 0% Avance')}
    </div>
  );
};

export default StatisticsCards;
