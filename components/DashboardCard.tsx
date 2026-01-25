
import React from 'react';

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-transparent rounded-2xl shadow-lg border border-black/10 dark:border-white/10 transform hover:-translate-y-1 transition-transform duration-300 ease-in-out">
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className="p-3 rounded-full bg-indigo-500/20 text-indigo-500 mr-4">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-black dark:text-white">{title}</h3>
        </div>
        <div className="text-black/80 dark:text-white/80">
          {children}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;