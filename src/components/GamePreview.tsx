import React, { useEffect, useRef } from 'react';
import { Play, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';
import type { LessonModule } from '../game/modulesData';

interface GamePreviewProps {
  code: string;
  crtFilter: boolean;
  currentModule: LessonModule;
  onSceneSelect?: (sceneKey: string) => void;
  onError: (err: string | null) => void;
}

export const GamePreview: React.FC<GamePreviewProps> = ({
  code,
  crtFilter,
  currentModule,
  onError
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Fungsi reload dan eksekusi kode ke dalam iframe sandbox
  const executeCodeInIframe = () => {
    if (!iframeRef.current) return;

    onError(null);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Phaser JRPG Preview</title>
        <style>
          * { box-sizing: border-box; }
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: #090d16;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: monospace;
          }
          canvas {
            display: block;
            border-radius: 4px;
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.2);
            image-rendering: pixelated;
            image-rendering: crisp-edges;
            max-width: 100% !important;
            max-height: 100% !important;
          }
          #error-box {
            display: none;
            color: #ef4444;
            padding: 16px;
            font-size: 13px;
            background: #1e1b4b;
            border: 1px solid #dc2626;
            border-radius: 8px;
            max-width: 90%;
            word-break: break-word;
          }
        </style>
        <!-- Menggunakan Phaser 3.80.1 UMD build yang stabil -->
        <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"><\/script>
      </head>
      <body>
        <div id="error-box"></div>
        <script>
          window.onerror = function(msg, url, line) {
            var errText = "Error Baris " + line + ": " + msg;
            var box = document.getElementById("error-box");
            if (box) {
              box.style.display = "block";
              box.innerText = errText;
            }
            window.parent.postMessage({ type: 'PHASER_ERROR', message: errText }, '*');
            return false;
          };

          if (typeof Phaser === 'undefined') {
            document.body.innerHTML = '<div style="color: #ef4444; padding: 20px;">Memuat Phaser 3 Engine... Mohon tunggu.</div>';
          } else {
            try {
              ${code}
            } catch (err) {
              window.parent.postMessage({ type: 'PHASER_ERROR', message: err.message }, '*');
            }
          }

          // Listener pesan virtual control dari parent
          window.addEventListener('message', function(event) {
            if (event.data && event.data.type === 'KEY_EVENT') {
              var keyEvent = new KeyboardEvent(event.data.action, {
                code: event.data.code,
                key: event.data.key,
                bubbles: true,
                cancelable: true
              });
              Object.defineProperty(keyEvent, 'keyCode', { get: function() { return event.data.keyCode; } });
              Object.defineProperty(keyEvent, 'which', { get: function() { return event.data.keyCode; } });
              window.dispatchEvent(keyEvent);
              document.dispatchEvent(keyEvent);
            }
          });
        <\/script>
      </body>
      </html>
    `;

    iframeRef.current.srcdoc = htmlContent;
  };

  // Pengirim event tombol virtual ke iframe
  const sendKey = (codeStr: string, keyStr: string, keyCodeNum: number, action: 'keydown' | 'keyup') => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: 'KEY_EVENT',
      action: action,
      code: codeStr,
      key: keyStr,
      keyCode: keyCodeNum
    }, '*');
  };

  useEffect(() => {
    executeCodeInIframe();

    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'PHASER_ERROR') {
        onError(e.data.message);
      }
    };
    window.addEventListener('message', handleMessage);

    // Meneruskan tombol keyboard dari parent window ke iframe
    const forwardKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('.monaco-editor'))) {
        return;
      }
      sendKey(e.code, e.key, e.keyCode, e.type as 'keydown' | 'keyup');
    };
    window.addEventListener('keydown', forwardKey);
    window.addEventListener('keyup', forwardKey);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', forwardKey);
      window.removeEventListener('keyup', forwardKey);
    };
  }, [code]);

  return (
    <section className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Preview Header Bar */}
      <div className="bg-slate-900/90 px-4 py-2 text-xs font-mono text-slate-300 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-100">Live Preview WebGL</span>
          <span className="text-slate-400">· 800 × 480 px (16:9 Retro)</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>{currentModule.panelNumber}</span>
        </div>
      </div>

      {/* Main Game Screen Canvas Container */}
      <div className="flex-1 relative flex items-center justify-center p-2 sm:p-4 bg-slate-950 overflow-hidden">
        {/* CRT Scanline Filter Overlay (Optional) */}
        {crtFilter && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: `
                linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
                linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))
              `,
              backgroundSize: '100% 3px, 6px 100%',
              boxShadow: 'inset 0 0 80px rgba(0,0,0,0.7)'
            }}
          />
        )}

        {/* The Sandboxed IFrame */}
        <div className="relative w-full max-w-[800px] aspect-[800/480] bg-black rounded-lg border border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center">
          <iframe
            ref={iframeRef}
            title="Pratinjau Game Phaser"
            className="w-full h-full border-0 select-none"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>

      {/* Interactive Controls & Gamepad Toolbar */}
      <div className="border-t border-slate-800 bg-slate-900/95 p-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
        {/* Keyboard instructions */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Gerak:</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 border border-slate-700">WASD</span>
            <span className="text-slate-400">atau</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 border border-slate-700">Panah</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Interaksi / Aksi:</span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400 border border-slate-700 font-bold">SPASI</span>
          </div>

          <div className="flex items-center gap-1.5 hidden md:flex">
            <span className="text-slate-400">Battle Menu:</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-400 border border-slate-700">1</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-400 border border-slate-700">2</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-400 border border-slate-700">3</span>
            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-400 border border-slate-700">4</span>
          </div>
        </div>

        {/* Virtual On-Screen Gamepad for easy touch / mouse play */}
        <div className="flex items-center gap-3">
          {/* Virtual D-Pad */}
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              type="button"
              aria-label="Gerak Atas"
              onMouseDown={() => sendKey('ArrowUp', 'ArrowUp', 38, 'keydown')}
              onMouseUp={() => sendKey('ArrowUp', 'ArrowUp', 38, 'keyup')}
              onTouchStart={() => sendKey('ArrowUp', 'ArrowUp', 38, 'keydown')}
              onTouchEnd={() => sendKey('ArrowUp', 'ArrowUp', 38, 'keyup')}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 rounded flex items-center justify-center text-slate-200 border border-slate-700"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <div />

            <button
              type="button"
              aria-label="Gerak Kiri"
              onMouseDown={() => sendKey('ArrowLeft', 'ArrowLeft', 37, 'keydown')}
              onMouseUp={() => sendKey('ArrowLeft', 'ArrowLeft', 37, 'keyup')}
              onTouchStart={() => sendKey('ArrowLeft', 'ArrowLeft', 37, 'keydown')}
              onTouchEnd={() => sendKey('ArrowLeft', 'ArrowLeft', 37, 'keyup')}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 rounded flex items-center justify-center text-slate-200 border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Gerak Bawah"
              onMouseDown={() => sendKey('ArrowDown', 'ArrowDown', 40, 'keydown')}
              onMouseUp={() => sendKey('ArrowDown', 'ArrowDown', 40, 'keyup')}
              onTouchStart={() => sendKey('ArrowDown', 'ArrowDown', 40, 'keydown')}
              onTouchEnd={() => sendKey('ArrowDown', 'ArrowDown', 40, 'keyup')}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 rounded flex items-center justify-center text-slate-200 border border-slate-700"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Gerak Kanan"
              onMouseDown={() => sendKey('ArrowRight', 'ArrowRight', 39, 'keydown')}
              onMouseUp={() => sendKey('ArrowRight', 'ArrowRight', 39, 'keyup')}
              onTouchStart={() => sendKey('ArrowRight', 'ArrowRight', 39, 'keydown')}
              onTouchEnd={() => sendKey('ArrowRight', 'ArrowRight', 39, 'keyup')}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 rounded flex items-center justify-center text-slate-200 border border-slate-700"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Virtual Action Button (Space / Interact) */}
          <button
            type="button"
            aria-label="Tombol Interaksi Spasi"
            onMouseDown={() => sendKey('Space', ' ', 32, 'keydown')}
            onMouseUp={() => sendKey('Space', ' ', 32, 'keyup')}
            onTouchStart={() => sendKey('Space', ' ', 32, 'keydown')}
            onTouchEnd={() => sendKey('Space', ' ', 32, 'keyup')}
            className="px-3 h-14 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 active:scale-95 text-slate-950 font-black rounded-lg shadow-md shadow-amber-600/20 text-xs flex flex-col items-center justify-center border border-amber-400/50"
          >
            <span>ACTION</span>
            <span className="text-[10px] font-mono opacity-80">(SPASI)</span>
          </button>
        </div>
      </div>
    </section>
  );
};
