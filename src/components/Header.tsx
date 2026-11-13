import React from 'react';
import { Sun, Moon, Plus } from 'lucide-react';
import { InstallButton } from './InstallButton';

interface HeaderProps {
  isDark: boolean;
  isRunning: boolean;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  isRunning,
  onToggleTheme,
  onOpenAddModal,
}) => {
  return (
    <header className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 sticky top-0 z-30 transition-colors">
      <div className="max-w-[920px] mx-auto flex items-center justify-between gap-2 sm:gap-4 px-3.5 sm:px-6 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <a
            href="#top"
            className="inline-flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100 whitespace-nowrap shrink-0"
          >
            <img
              src="./icon.svg"
              alt="CzasoPłaca"
              className="w-7 h-7 rounded-lg shrink-0"
            />
            <span>CzasoPłaca</span>
          </a>

          {isRunning && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden xs:inline">W trakcie</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <InstallButton />

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Przełącz na jasny motyw' : 'Przełącz na ciemny motyw'}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="hidden sm:inline">{isDark ? 'Jasny' : 'Ciemny'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            aria-label="Dodaj wpis"
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Dodaj</span>
            <span className="hidden sm:inline">Dodaj wpis</span>
          </button>
        </div>
      </div>
    </header>
  );
};
