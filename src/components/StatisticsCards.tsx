import React from 'react';

const StatisticsCards: React.FC = () => {
  // Data based on the image
  const totalParticipants = {
    becados: { count: 142, percentage: 63 },
    empresa: { count: 61, percentage: 27 },
    total: 203,
  };

  const zeroAdvanceParticipants = {
    becados: { count: 105, percentage: 78 },
    empresa: { count: 30, percentage: 22 },
    total: 135,
  };

  const StatCard = ({ 
    title, 
    count, 
    percentage, 
    bgColor, 
    textColor: _textColor = "text-white",
    isTotal = false 
  }: {
    title: string;
    count: number;
    percentage?: number;
    bgColor: string;
    textColor?: string;
    isTotal?: boolean;
  }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden`}>
      <div className="p-4">
        <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
        <div className="flex items-end justify-between">
          <div className={`${isTotal ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900`}>{count}</div>
          {percentage && !isTotal && (
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
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
      {isTotal && (
        <div className={`h-1 ${bgColor}`}></div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 w-full">
      {/* Total Participantes Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Total Participantes</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            title="Becados"
            count={totalParticipants.becados.count}
            percentage={totalParticipants.becados.percentage}
            bgColor="bg-blue-500"
          />
          <StatCard
            title="Empresa"
            count={totalParticipants.empresa.count}
            percentage={totalParticipants.empresa.percentage}
            bgColor="bg-green-600"
          />
          <StatCard
            title="Total Alumnos"
            count={totalParticipants.total}
            bgColor="bg-gray-800"
            isTotal={true}
          />
        </div>
      </div>

      {/* Participantes con 0% de Avance Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Participantes con 0% de Avance</h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            title="Becados"
            count={zeroAdvanceParticipants.becados.count}
            percentage={zeroAdvanceParticipants.becados.percentage}
            bgColor="bg-blue-500"
          />
          <StatCard
            title="Empresa"
            count={zeroAdvanceParticipants.empresa.count}
            percentage={zeroAdvanceParticipants.empresa.percentage}
            bgColor="bg-green-600"
          />
          <StatCard
            title="Alumnos 0% Avance"
            count={zeroAdvanceParticipants.total}
            bgColor="bg-gray-800"
            isTotal={true}
          />
        </div>
      </div>
    </div>
  );
};

export default StatisticsCards;
