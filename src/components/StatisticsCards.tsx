import React, { useMemo } from 'react';
import type { DashboardInscripcion, Metrics } from '../services/dashboard';

interface Props {
  items: DashboardInscripcion[];
  loading?: boolean;
  error?: string | null;
}

const emptyMetrics = (): Metrics => ({ becados: 0, empresa: 0, sence: 0, senceEmpresa: 0 });

const sumMetrics = (a: Metrics, b?: Metrics): Metrics => {
  const src = b || emptyMetrics();
  return {
    becados: a.becados + (src.becados || 0),
    empresa: a.empresa + (src.empresa || 0),
    sence: a.sence + (src.sence || 0),
    senceEmpresa: a.senceEmpresa + (src.senceEmpresa || 0),
  };
};

interface StatCardProps {
  title: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
  isTotal?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, percentage, color, bgColor, isTotal = false }) => (
  <div className={`p-4 rounded-lg border ${isTotal ? 'border-gray-300' : 'border-gray-200'} bg-white`}> 
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
      {!isTotal && (
        <span className={`text-sm font-semibold ${color}`}>{percentage.toFixed(1)}%</span>
      )}
    </div>
    <div className="flex items-center justify-between">
      <span className={`text-2xl font-bold ${color}`}>{count}</span>
      {!isTotal && (
        <div className="w-16 bg-gray-100 rounded-full h-2">
          <div 
            className={`${bgColor} h-2 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      )}
    </div>
  </div>
);

const StatisticsCards: React.FC<Props> = ({ items, loading, error }) => {
  const totalMetrics = useMemo(() => {
    return items.reduce((acc, item) => sumMetrics(acc, item.totalByCategory), emptyMetrics());
  }, [items]);

  const zeroAdvanceMetrics = useMemo(() => {
    return items.reduce((acc, item) => sumMetrics(acc, item.zeroByCategory), emptyMetrics());
  }, [items]);

  const totalCount = Object.values(totalMetrics).reduce((sum, val) => sum + val, 0);
  const zeroCount = Object.values(zeroAdvanceMetrics).reduce((sum, val) => sum + val, 0);

  const renderSection = (title: string, metrics: Metrics, total: number, totalTitle: string) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Becados"
          count={metrics.becados}
          percentage={total ? (metrics.becados / total) * 100 : 0}
          color="text-blue-600"
          bgColor="bg-blue-500"
        />
        <StatCard
          title="Empresa"
          count={metrics.empresa}
          percentage={total ? (metrics.empresa / total) * 100 : 0}
          color="text-green-600"
          bgColor="bg-green-500"
        />
        <StatCard
          title="Sence"
          count={metrics.sence}
          percentage={total ? (metrics.sence / total) * 100 : 0}
          color="text-purple-600"
          bgColor="bg-purple-500"
        />
        <StatCard
          title="Sence + Empresa"
          count={metrics.senceEmpresa}
          percentage={total ? (metrics.senceEmpresa / total) * 100 : 0}
          color="text-orange-600"
          bgColor="bg-orange-500"
        />
        <StatCard
          title={totalTitle}
          count={total}
          percentage={100}
          color="text-gray-800"
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
