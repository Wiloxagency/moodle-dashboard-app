import React from 'react';
import Sidebar from '../components/Sidebar';
import StatisticsCards from '../components/StatisticsCards';
import CourseTable from '../components/CourseTable';
import ExportarInscripciones from '../components/ExportarInscripciones';

const Dashboard: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="p-6">
          {/* Statistics Cards */}
          <div className="mb-8 w-full max-w-[1150px] mx-auto">
            <StatisticsCards />
          </div>
          
          {/* Exportar Inscripciones */}
          <div className="mb-8 w-full max-w-[1150px] mx-auto">
            <ExportarInscripciones />
          </div>
          
          {/* Course Table */}
          <div className="w-full max-w-[1150px] mx-auto">
            <CourseTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
