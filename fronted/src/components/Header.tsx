
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm sticky top-0 z-10">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                DC
            </div>
            <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">Daly College Assistant</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Gyanamev Shakti (Knowledge itself is Power)</p>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
