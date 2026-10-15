import React from 'react';
import { X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReferenceModal: React.FC<ReferenceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Referensi Visual Asli: Scene Forest Outskirts
              </h2>
              <p className="text-xs text-slate-400">
                Pencocokan Detail Visual dari Gambar Referensi ke Kode Game Phaser 3
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Referensi"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-lg overflow-hidden border border-slate-800 shadow-lg bg-black">
            <img
              src="/src/assets/images/jrpg_forest_outskirts_1792026710872.jpg"
              alt="Referensi JRPG Forest Outskirts"
              className="w-full h-auto object-contain max-h-[380px]"
            />
          </div>

          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Checklist Fitur & Keselarasan Desain:
            </h3>
            <div className="grid md:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-100">Party HUD Lengkap:</span>
                  <p className="text-slate-400">Status Kaelen, Lyra, Brutus, dan Elara dengan bar HP (merah) dan MP (biru) di atas layar.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-100">Minimap Pojok Kanan Atas:</span>
                  <p className="text-slate-400">Menampilkan denah tepi hutan, ikon toko senjata, kedai makanan, dan posisi party.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-100">Tenda &quot;Weapons &amp; Armor&quot;:</span>
                  <p className="text-slate-400">Tenda bergaris merah-biru dengan pandai besi beranimasi menempa dan display senjata.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-100">Gerobak &quot;Grub &amp; Grill&quot;:</span>
                  <p className="text-slate-400">Kedai makanan berpayung garis kuning-hijau dengan panggangan sate, asap partikel, dan safe zone.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-100">Formasi 4 Karakter:</span>
                  <p className="text-slate-400">Kaelen (Knight), Lyra (Elf Ranger), Brutus (Dwarf), dan Elara (Rogue) berjalan beriringan.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-100">Ambush &amp; Turn-Based Combat:</span>
                  <p className="text-slate-400">Musuh bandit mengintip dari balik semak-semak lebat, disusul transisi pertempuran SNES.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};
