import React from 'react';
import { X, BookOpen, Code, Compass, Zap, Swords, HeartHandshake, Eye } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Panduan Materi Pemrograman JRPG Klasik (Phaser 3)
              </h2>
              <p className="text-xs text-slate-400">
                Memahami Struktur Logika Permainan dari Panel 1 sampai Panel 5
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Panduan"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          {/* Panel 1 */}
          <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-base">
              <Compass className="w-4 h-4" />
              <span>Panel 1: Logika Pergerakan Party & Follower Trail (Forest Outskirts)</span>
            </div>
            <p className="text-xs text-slate-400">
              Bagaimana 4 karakter bergerak beriringan tanpa bertumpuk atau kaku?
            </p>
            <div className="grid md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">1. Trail History Queue</span>
                Karakter Leader (Kaelen) merekam posisi <code className="text-amber-300">{`{ x, y, flipX }`}</code> ke dalam array setiap frame bergerak.
                Follower ke-1 (Lyra) mengambil index <code className="text-sky-300">16</code>, Follower ke-2 (Brutus) index <code className="text-sky-300">32</code>, dan Follower ke-3 (Elara) index <code className="text-sky-300">48</code>.
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">2. Parallax & Batasan Jalur</span>
                Background digambar berlapis (Langit Senja, Jajaran Gunung, Pohon Pinus) dengan kedalaman berbeda. Jalur dibatasi menggunakan <code className="text-amber-300">Phaser.Math.Clamp(leader.y, 330, 410)</code>.
              </div>
            </div>
          </section>

          {/* Panel 2 */}
          <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-base">
              <Code className="w-4 h-4" />
              <span>Panel 2: Interaksi NPC & Toko Senjata (Weapons Merchant)</span>
            </div>
            <p className="text-xs text-slate-400">
              Sistem deteksi radius kedekatan dan jendela dialog retro monokrom.
            </p>
            <div className="grid md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">1. Proximity Check</span>
                Menggunakan formula selisih jarak horizontal <code className="text-sky-300">Math.abs(leader.x - npc.x) &lt; 45</code>. Ketika pemain berada di dalam zona, tombol prompt [SPASI] dimunculkan.
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">2. State Transisi & Transaksi</span>
                Saat berdialog, game beralih ke state <code className="text-amber-300">&apos;DIALOG&apos;</code> sehingga pergerakan pemain dihentikan sementara. Pemain dapat menekan angka [1] untuk membeli senjata dan meningkatkan poin ATK.
              </div>
            </div>
          </section>

          {/* Panel 3 */}
          <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-base">
              <HeartHandshake className="w-4 h-4" />
              <span>Panel 3: Kedai Makanan & Zona Aman (Grub & Grill Safe Zone)</span>
            </div>
            <p className="text-xs text-slate-400">
              Efek partikel asap panggangan, bara api, dan sistem regenerasi HP/MP party.
            </p>
            <div className="grid md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">1. Emitter Partikel Asap</span>
                Dibuat dengan <code className="text-emerald-300">scene.add.particles()</code> dengan kecepatan vertikal negatif (bergerak ke atas), alfa transparan, dan pertambahan skala ukuran.
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">2. Safe Zone Healing Effect</span>
                Ketika pemain berhenti di sekitar kedai makanan, regenerasi pasif aktif dan memancarkan partikel hati terapung merah serta pemulihan visual HP/MP bar.
              </div>
            </div>
          </section>

          {/* Panel 4 */}
          <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-base">
              <Eye className="w-4 h-4" />
              <span>Panel 4: Penyergapan Penjahat (Ambush Alert Sequence)</span>
            </div>
            <p className="text-xs text-slate-400">
              Membangun ketegangan dengan peralihan kamera sinematik dan tanda seru (!).
            </p>
            <div className="grid md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">1. Camera Pan & Palette Shift</span>
                Kamera beralih fokus secara otomatis ke arah semak-semak lebat dengan <code className="text-rose-300">cameras.main.pan()</code>, diiringi peredupan warna latar ke nada biru-gelap malam (suspense mood).
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">2. Sequential Alert Exclamation (!)</span>
                Ikon tanda seru (!) dimunculkan bergantian di atas kepala tiap anggota party dengan jeda waktu <code className="text-amber-300">scene.time.delayedCall</code> dan SFX Web Audio retro sting.
              </div>
            </div>
          </section>

          {/* Panel 5 */}
          <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-base">
              <Swords className="w-4 h-4" />
              <span>Panel 5: Sistem Pertarungan Turn-Based JRPG (Battle Start)</span>
            </div>
            <p className="text-xs text-slate-400">
              Transisi flash layar, formasi pertempuran, menu perintah, dan kalkulasi damage.
            </p>
            <div className="grid md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">1. Formasi & Menu Aksi</span>
                Party di sisi kiri dalam posisi tempur, 4 bandit musuh di sisi kanan. Menu aksi bawah: Serang (Attack), Sihir (Magic), Item Potion, dan Kabur (Run).
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-bold text-slate-200 block mb-1">2. Formula Damage & Turn Queue</span>
                Formula damage standar: <code className="text-purple-300">DMG = Math.max(1, (ATK * Multiplier) - (DEF * 0.5))</code>. Setelah giliran pemain, musuh membalas serangan secara otomatis diiringi camera shake!
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            Mengerti & Mulai Belajar
          </button>
        </div>
      </div>
    </div>
  );
};
