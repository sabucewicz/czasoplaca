import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const InstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (!showGuide) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGuide(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showGuide]);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label="Zainstaluj aplikację na urządzeniu"
        className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Zainstaluj</span>
      </button>

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-xs p-4"
        >
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="./icon.svg"
                  alt="Ikona aplikacji CzasoPłaca"
                  className="w-11 h-11 rounded-xl shrink-0 bg-zinc-950"
                />
                <div>
                  <h3
                    id="pwa-install-title"
                    className="text-base font-bold text-zinc-900 dark:text-white"
                  >
                    Zainstaluj CzasoPłaca
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Dodaj aplikację na ekran główny
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Zamknij"
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>iPhone / iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>Kliknij ikonę <strong>Udostępnij</strong> na dolnym pasku Safari.</li>
                  <li>Wybierz <strong>Dodaj do ekranu początkowego</strong>.</li>
                  <li>Potwierdź przyciskiem <strong>Dodaj</strong>.</li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Android / Chrome:</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>Otwórz menu przeglądarki <strong>⋮</strong> w prawym górnym rogu.</li>
                  <li>Wybierz <strong>Zainstaluj aplikację</strong> lub <strong>Dodaj do ekranu głównego</strong>.</li>
                  <li>Potwierdź instalację skrótu.</li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors cursor-pointer"
            >
              Zamknij
            </button>
          </div>
        </div>
      )}
    </>
  );
};
