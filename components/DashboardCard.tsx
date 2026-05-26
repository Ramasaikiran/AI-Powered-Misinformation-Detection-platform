
import React from 'react';

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon, children }) => {
  return (
    <div className="glass glass-card rounded-3xl p-6 border border-white/5 shadow-2xl hover:border-cyan-400/20 hover:shadow-[0_15px_40px_rgba(0,240,255,0.1)] transition-all duration-300">
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500/10 to-indigo-500/10 text-cyan-400 border border-cyan-400/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.15)]">
          {icon}
        </div>
        <h3 className="text-lg font-black font-heading tracking-wide text-white uppercase">{title}</h3>
      </div>
      <div className="text-white/80">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;