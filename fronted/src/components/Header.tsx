import React from 'react';
import dcLogo from '../assets/logo1.png'; // ✅ Daly College logo

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-700 flex items-center justify-center">
            <img
              src={dcLogo}
              alt="Daly College Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">
              Daly College Assistant
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gyanamev Shakti (Knowledge itself is Power)
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
