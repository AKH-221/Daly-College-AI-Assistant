import React from 'react';
import dcLogo from '../assets/logo1.png'; // ✅ Daly College logo

const Header: React.FC = () => {
  return (
    <header className="site-header sticky top-0 z-10">
      <div className="header-inner max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="header-logo w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
            <img
              src={dcLogo}
              alt="Daly College Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold">
              Daly College Assistant
            </h1>
            <p className="text-xs">
              Gyanamev Shakti (Knowledge itself is Power)
            </p>
          </div>
        </div>
        <nav className="header-nav hidden md:flex items-center gap-6" aria-label="Assistant sections">
          <span>Heritage</span>
          <span>Campus</span>
          <span>Admissions</span>
        </nav>
        <div className="header-status hidden sm:flex items-center gap-2 text-xs">
          <span className="status-dot" aria-hidden="true" />
          <span>Ready to help</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
