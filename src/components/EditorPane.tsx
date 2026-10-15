import React from 'react';
import Editor from '@monaco-editor/react';
import { Sparkles, Terminal, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { LessonModule } from '../game/modulesData';

interface EditorPaneProps {
  code: string;
  onChangeCode: (newCode: string) => void;
  currentModule: LessonModule;
  onRunCode: () => void;
  runtimeError: string | null;
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  code,
  onChangeCode,
  currentModule,
  onRunCode,
  runtimeError
}) => {
  // Quick Code Modifications for learning
  const applySnippet = (type: 'speed' | 'damage' | 'heal' | 'gold') => {
    let newCode = code;
    if (type === 'speed') {
      if (newCode.includes('const speed = 150')) {
        newCode = newCode.replace('const speed = 150', 'const speed = 280 // MODIFIKASI: Kecepatan lari x2!');
      } else if (newCode.includes('speed = 160')) {
        newCode = newCode.replace('speed = 160', 'speed = 300 // MODIFIKASI: Kecepatan lari x2!');
      }
    } else if (type === 'damage') {
      if (newCode.includes('atk: 28')) {
        newCode = newCode.replace('atk: 28', 'atk: 99 // MODIFIKASI: ATK Kaelen Super Kuat!');
      } else if (newCode.includes('playerAtk = 25')) {
        newCode = newCode.replace('playerAtk = 25', 'playerAtk = 85 // MODIFIKASI: ATK Super Kuat!');
      }
    } else if (type === 'heal') {
      if (newCode.includes('potions = 3')) {
        newCode = newCode.replace('potions = 3', 'potions = 10 // MODIFIKASI: Stok 10 Potion!');
      }
    } else if (type === 'gold') {
      if (newCode.includes('let gold = 150')) {
        newCode = newCode.replace('let gold = 150', 'let gold = 999 // MODIFIKASI: 999 Koin Emas!');
      } else if (newCode.includes('gold = 100')) {
        newCode = newCode.replace('gold = 100', 'gold = 500 // MODIFIKASI: 500 Koin Emas!');
      }
    }
    onChangeCode(newCode);
  };

  return (
    <section className="flex-1 flex flex-col h-full bg-slate-950 border-r border-slate-800 overflow-hidden">
      {/* Editor Sub-header Bar */}
      <div className="bg-slate-900/90 px-4 py-2 text-xs font-mono text-slate-300 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-400">game.js</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 truncate max-w-xs">{currentModule.panelNumber}: {currentModule.title}</span>
        </div>

        {/* Experimentation Presets */}
        <div className="flex items-center gap-1 text-[11px]">
          <span className="text-slate-400 hidden xl:inline flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Coba Ubah Nilai:
          </span>
          <button
            type="button"
            onClick={() => applySnippet('speed')}
            title="Ubah kecepatan pergerakan karakter"
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            ⚡ Lari Cepat
          </button>
          <button
            type="button"
            onClick={() => applySnippet('damage')}
            title="Tingkatkan nilai statistik serangan Kaelen"
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            💥 ATK 99
          </button>
          <button
            type="button"
            onClick={() => applySnippet('gold')}
            title="Tambah koin emas untuk belanja toko senjata"
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          >
            🪙 Gold 999
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full relative">
        <Editor
          height="100%"
          language="javascript"
          theme="vs-dark"
          value={code}
          onChange={(val) => onChangeCode(val || '')}
          options={{
            fontSize: 13,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            suggestOnTriggerCharacters: true,
            renderWhitespace: 'none',
            folding: true,
            cursorBlinking: 'smooth'
          }}
        />
      </div>

      {/* Editor Status / Console Log Tray */}
      <div className="border-t border-slate-800 bg-slate-900/95 px-4 py-2 shrink-0">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            {runtimeError ? (
              <span className="text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate max-w-md">{runtimeError}</span>
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Phaser 3.80.1 Engine Siap · Tekan &quot;Jalankan &amp; Mainkan!&quot; untuk update</span>
              </span>
            )}
          </div>
          <span className="text-slate-400 hidden sm:inline">
            Pintasan: <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">Ctrl</kbd> + <kbd className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-300">Enter</kbd>
          </span>
        </div>
      </div>
    </section>
  );
};
