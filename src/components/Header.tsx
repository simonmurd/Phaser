import React from 'react';
import { Play, RotateCcw, BookOpen, Volume2, VolumeX, Monitor, Image as ImageIcon, Sparkles } from 'lucide-react';
import { MODULES, type LessonModule } from '../game/modulesData';

interface HeaderProps {
  currentModule: LessonModule;
  onSelectModule: (m: LessonModule) => void;
  onRunCode: () => void;
  onResetCode: () => void;
  onOpenTheory: () => void;
  onOpenReference: () => void;
  onOpenGraphicsGuide: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  crtFilter: boolean;
  onToggleCrt: () => void;
  isRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  onSelectModule,
  onRunCode,
  onResetCode,
  onOpenTheory,
  onOpenReference,
  onOpenGraphicsGuide,
  soundEnabled,
  onToggleSound,
  crtFilter,
  onToggleCrt,
  isRunning
}) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between gap-4 z-20 shrink-0">
      {/* Zone 1: Brand & Logo */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20 text-slate-950 font-black text-sm">
          ⚔️
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 tracking-wide text-sm md:text-base font-sans">
              JRPG STUDIO
            </span>
            <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
              PHASER JS
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Materi Belajar Logika RPG Klasik SNES
          </p>
        </div>
      </div>

      {/* Zone 2: Module Switcher */}
      <div className="flex items-center gap-2 max-w-md w-full justify-center">
        <label htmlFor="module-select" className="sr-only">Pilih Modul Pembelajaran</label>
        <select
          id="module-select"
          aria-label="Pilih Modul Pembelajaran"
          value={currentModule.id}
          onChange={(e) => {
            const found = MODULES.find(m => m.id === e.target.value);
            if (found) onSelectModule(found);
          }}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-xs md:text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium truncate w-full cursor-pointer hover:bg-slate-750 transition-colors"
        >
          {MODULES.map(mod => (
            <option key={mod.id} value={mod.id}>
              {mod.title} ({mod.panelNumber})
            </option>
          ))}
        </select>
      </div>

      {/* Zone 3: Actions & Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenGraphicsGuide}
          title="Panduan Meningkatkan Kualitas Grafis Game"
          aria-label="Buka Panduan Kualitas Grafis"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 rounded-lg border border-amber-500/30 transition-colors shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Tingkatkan Grafis ✨</span>
        </button>

        <button
          type="button"
          onClick={onOpenTheory}
          title="Buka Penjelasan Teori & Modul"
          aria-label="Buka Panduan Teori"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-300" />
          <span className="hidden lg:inline">Panduan Materi</span>
        </button>

        <button
          type="button"
          onClick={onOpenReference}
          title="Bandingkan dengan Gambar Referensi Asli"
          aria-label="Bandingkan Referensi Visual"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden lg:inline">Referensi Visual</span>
        </button>

        <button
          type="button"
          onClick={onToggleCrt}
          title={crtFilter ? 'Matikan Filter Retro CRT' : 'Aktifkan Filter Retro CRT'}
          aria-label="Toggle Filter CRT"
          className={`p-1.5 text-xs font-medium rounded-lg border transition-colors ${
            crtFilter
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleSound}
          title={soundEnabled ? 'Matikan Efek Suara' : 'Aktifkan Efek Suara'}
          aria-label="Toggle Suara Audio"
          className={`p-1.5 text-xs font-medium rounded-lg border transition-colors ${
            soundEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={onResetCode}
          title="Kembalikan Kode Asli Modul Ini"
          aria-label="Reset Kode Modul"
          className="p-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onRunCode}
          aria-label="Jalankan dan Mainkan Kode"
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold px-3 md:px-4 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-900/30 text-xs md:text-sm active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Jalankan & Mainkan!</span>
        </button>
      </div>
    </header>
  );
};
