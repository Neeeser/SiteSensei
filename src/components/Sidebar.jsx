// componets/Sidebar.jsx
import React from 'react';
import { X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose, children }) => {
  return (
    <div
      className={`fixed top-0 right-0 z-50 h-full w-72 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="glass-panel flex h-full flex-col rounded-none rounded-l-3xl border-l border-slate-200/70 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-4 dark:border-slate-800/60">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
            Edit page
          </h2>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-200/60 bg-white/70 p-2 text-slate-500 transition hover:-translate-y-0.5 hover:text-indigo-500 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-indigo-300"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
