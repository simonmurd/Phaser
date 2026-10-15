import React from 'react';
import { X, Sparkles, Sun, Layers, Feather, Monitor, CheckCircle, Code } from 'lucide-react';

interface GraphicsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GraphicsGuideModal: React.FC<GraphicsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const pillars = [
    {
      icon: <Layers className="w-5 h-5 text-amber-400" />,
      title: '1. Layering & High-Resolution Pixel Art Backdrop',
      desc: 'Hindari bentuk geometris datar (flat polygons/triangles). Gunakan tekstur pixel art berlapis dengan kedalaman atmosferis (skybox senja, jajaran gunung, kanopi pohon pinus bertingkat, dan tekstur kerikil pada jalan setapak).',
      codeSnippet: `// Muat aset backdrop pixel art resolusi tinggi
this.load.image('bg_forest_hd', '/assets/jrpg_forest.jpg');
const bg = this.add.image(400, 240, 'bg_forest_hd')
  .setDisplaySize(800, 480)
  .setDepth(0);`
    },
    {
      icon: <Sun className="w-5 h-5 text-orange-400" />,
      title: '2. Dynamic Lighting & WebGL Additive Blending',
      desc: 'Tambahkan sumber cahaya dinamis (lampu lentera, api unggun, bara panggangan) menggunakan blend mode ADD. Lapisi dunia dengan overlay warna hangat (Golden Hour) untuk menyatukan warna seluruh karakter.',
      codeSnippet: `// Efek pendaran lentera hangat (Additive Glow)
const glow = this.add.circle(220, 280, 50, 0xf59e0b, 0.25)
  .setBlendMode('ADD')
  .setDepth(15);

// Animasi berdenyut seperti nyala api asli
this.tweens.add({
  targets: glow,
  scale: 1.15, alpha: 0.18, duration: 800, yoyo: true, repeat: -1
});`
    },
    {
      icon: <Feather className="w-5 h-5 text-emerald-400" />,
      title: '3. Contact Shadows (Bayangan Kaki) & Grounding',
      desc: 'Karakter sering terlihat "mengambang" di atas jalan jika tidak memiliki bayangan kontak. Tambahkan elips hitam semi-transparan tepat di bawah kaki karakter yang mengikuti koordinat setiap frame.',
      codeSnippet: `// Buat bayangan elips di bawah kaki karakter
const shadow = this.add.ellipse(hero.x, hero.y + 16, 22, 7, 0x000000, 0.45)
  .setDepth(19);

// Pada update loop:
shadow.setPosition(hero.x, hero.y + 16);`
    },
    {
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      title: '4. Living World Particles (Daun Gugur & Debu Langkah)',
      desc: 'Lingkungan yang statis terasa mati. Tambahkan partikel ambient seperti daun gugur yang melayang perlahan ditiup angin, asap panggangan yang membubung, dan kepulan debu tipis saat kaki melangkah.',
      codeSnippet: `// Partikel daun gugur ambient
this.add.particles(0, 0, 'particle_leaf', {
  x: { min: 0, max: 800 }, y: { min: -10, max: 0 },
  speedY: { min: 25, max: 50 }, speedX: { min: 10, max: 35 },
  rotate: { min: 0, max: 360 }, lifespan: 7000, frequency: 400
});`
    },
    {
      icon: <Monitor className="w-5 h-5 text-purple-400" />,
      title: '5. Post-Processing & Retro CRT Scanline Shaders',
      desc: 'Game era SNES/PS1 dirancang untuk tabung kaca monitor CRT. Menambahkan filter scanline, sedikit chromatic aberration, atau vignette di sekeliling layar memberi kesan nostalgia otentik yang hangat.',
      codeSnippet: `// Filter CRT via CSS scanline overlay di atas WebGL Canvas
background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
boxShadow: 'inset 0 0 80px rgba(0,0,0,0.7)';`
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Panduan Meningkatkan Kualitas Grafis Game RPG (Phaser 3)
              </h2>
              <p className="text-xs text-slate-400">
                5 Teknik Industri untuk Mengubah Grafis Sederhana Menjadi Visual Retro SNES Berkualitas Tinggi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Panduan Grafis"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Summary Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-amber-200 block text-sm mb-1">
                Kini Telah Diterapkan di Game Preview!
              </span>
              Game ini telah kami tingkatkan dengan aset <strong>HD Pixel Art Backdrop</strong>, sistem <strong>Dynamic Torchlight Glow</strong> dengan mode Additive Blend, <strong>Contact Shadows</strong> di bawah kaki 4 anggota party, dan <strong>Ambient Falling Leaves</strong>.
            </div>
          </div>

          {/* 5 Pillars */}
          <div className="space-y-4">
            {pillars.map((item, idx) => (
              <div key={idx} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-300 pl-9 leading-relaxed">
                  {item.desc}
                </p>

                {/* Code Snippet */}
                <div className="ml-9 mt-2 bg-slate-900/90 rounded-lg p-3 border border-slate-800 font-mono text-[11px] text-amber-300/90 overflow-x-auto">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mb-1">
                    <Code className="w-3 h-3" /> Contoh Kode Implementasi di Phaser 3:
                  </div>
                  <pre className="whitespace-pre-wrap">{item.codeSnippet}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-400">
            Coba aktifkan juga tombol <strong>Filter CRT</strong> di header bar atas untuk efek monitor tabung retro!
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            Tutup &amp; Coba di Game
          </button>
        </div>
      </div>
    </div>
  );
};
