import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { EditorPane } from './components/EditorPane';
import { GamePreview } from './components/GamePreview';
import { TheoryModal } from './components/TheoryModal';
import { ReferenceModal } from './components/ReferenceModal';
import { GraphicsGuideModal } from './components/GraphicsGuideModal';
import { MODULES, type LessonModule } from './game/modulesData';
import { Code, Gamepad2 } from 'lucide-react';

export default function App() {
  const [currentModule, setCurrentModule] = useState<LessonModule>(MODULES[0]);
  const [code, setCode] = useState<string>(MODULES[0].code);
  const [activeCode, setActiveCode] = useState<string>(MODULES[0].code);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [crtFilter, setCrtFilter] = useState<boolean>(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isReferenceOpen, setIsReferenceOpen] = useState<boolean>(false);
  const [isGraphicsGuideOpen, setIsGraphicsGuideOpen] = useState<boolean>(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  // Mode Tampilan Mobile: 'editor' | 'preview'
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('preview');

  // Update kode saat modul berganti
  const handleSelectModule = (mod: LessonModule) => {
    setCurrentModule(mod);
    setCode(mod.code);
    setActiveCode(mod.code);
    setRuntimeError(null);
  };

  // Reset kode modul ke versi standar
  const handleResetCode = () => {
    setCode(currentModule.code);
    setActiveCode(currentModule.code);
    setRuntimeError(null);
  };

  // Jalankan dan sinkronkan kode dari editor ke preview iframe
  const handleRunCode = () => {
    setRuntimeError(null);
    setActiveCode(code);
  };

  // Pintasan Keyboard Ctrl + Enter untuk menjalankan kode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Header Bar */}
      <Header
        currentModule={currentModule}
        onSelectModule={handleSelectModule}
        onRunCode={handleRunCode}
        onResetCode={handleResetCode}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onOpenReference={() => setIsReferenceOpen(true)}
        onOpenGraphicsGuide={() => setIsGraphicsGuideOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        crtFilter={crtFilter}
        onToggleCrt={() => setCrtFilter(!crtFilter)}
        isRunning={true}
      />

      {/* Mobile Tab Switcher (Hanya tampil di layar kecil < md) */}
      <div className="flex md:hidden bg-slate-900 border-b border-slate-800 p-1 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'editor'
              ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Editor Kode (game.js)</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'preview'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700 shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Game Canvas (Phaser)</span>
        </button>
      </div>

      {/* Workspace Area: Split-view 50% Editor + 50% Game Preview */}
      <main className="flex-1 flex overflow-hidden w-full relative">
        {/* Editor Pane */}
        <div className={`w-full md:w-1/2 h-full flex flex-col ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
          <EditorPane
            code={code}
            onChangeCode={setCode}
            currentModule={currentModule}
            onRunCode={handleRunCode}
            runtimeError={runtimeError}
          />
        </div>

        {/* Game Preview Pane */}
        <div className={`w-full md:w-1/2 h-full flex flex-col ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
          <GamePreview
            code={activeCode}
            crtFilter={crtFilter}
            currentModule={currentModule}
            onError={setRuntimeError}
          />
        </div>
      </main>

      {/* Modals */}
      <TheoryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
      />

      <ReferenceModal
        isOpen={isReferenceOpen}
        onClose={() => setIsReferenceOpen(false)}
      />

      <GraphicsGuideModal
        isOpen={isGraphicsGuideOpen}
        onClose={() => setIsGraphicsGuideOpen(false)}
      />
    </div>
  );
}
