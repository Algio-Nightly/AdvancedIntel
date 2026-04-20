import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderClosed, Library, Settings as SettingsIcon, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-5 py-2 rounded-full transition-all duration-300 font-display text-xs tracking-[0.1em] uppercase ${isActive
      ? 'bg-primary-container/20 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)] font-bold'
      : 'text-on-surface/60 hover:text-primary hover:bg-surface-container-highest/30 font-bold'
    }`;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-4xl">
      <div className="glass-container rounded-full px-6 py-3 flex items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl border border-outline-variant/30 bg-surface-container-low/40">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-primary-container flex items-center justify-center shadow-ambient">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse shadow-[0_0_8px_#2b6485]"></div>
          </div>
          <span className="font-light tracking-[0.2em] font-display text-primary text-sm">ADVANCED INTEL</span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-2">
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard size={14} />
            <span className="hidden md:inline">Dashboard</span>
          </NavLink>

          <NavLink to="/projects" className={navLinkClass}>
            <FolderClosed size={14} />
            <span className="hidden md:inline">Projects</span>
          </NavLink>

          <NavLink to="/library" className={navLinkClass}>
            <Library size={14} />
            <span className="hidden md:inline">Library</span>
          </NavLink>
        </nav>

        {/* Profile / Settings */}
        <div className="flex items-center gap-4 border-l border-outline-variant/30 pl-4 ml-2 relative">
          <NavLink to="/settings" className={navLinkClass}>
            <SettingsIcon size={14} />
          </NavLink>

          {currentUser && (
            <div className="relative">
              <div
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="h-8 w-8 rounded-full bg-primary-container/40 flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors border border-outline-variant/50"
              >
                <User size={14} className="text-primary" />
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 top-12 w-48 glass-container p-2 shadow-ambient border border-outline-variant/30 flex flex-col gap-1 z-50">
                  <div className="px-3 py-2 border-b border-outline-variant/20 mb-1">
                    <p className="text-[10px] meta-label opacity-50 truncate">{currentUser.email}</p>
                  </div>
                  <button onClick={() => { setShowProfileMenu(false); navigate('/settings'); }} className="text-left px-3 py-2 text-xs font-display tracking-widest hover:bg-surface-container-highest/50 rounded transition-colors w-full">PROFILE</button>
                  <button onClick={handleLogout} className="text-left px-3 py-2 text-xs font-display tracking-widest text-error hover:bg-error/10 rounded transition-colors w-full">DISCONNECT</button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
