/**
 * Kode Modul dan Pembelajaran JRPG Phaser 3 - Edisi 16-Bit High-Resolution Pixel Art
 * Menghadirkan grafis JRPG otentik (Chrono Trigger / Final Fantasy VI style):
 * - Sprite Party Kaelen, Lyra, Brutus, Elara beresolusi tinggi dengan drop shadow & animasi jalan
 * - Background alam tepi hutan senja beresolusi tinggi dengan kastil & tenda toko
 * - NPC Pandai Besi & Chef Makanan interaktif dengan partikel asap & percikan tempa
 * - Bandit penyergap dengan mata merah menyala di semak-semak
 * - Top HUD dengan potret berbingkai emas retro & radar peta mini
 * - Sistem pertarungan turn-based dengan arena pertempuran malam hari
 */

export interface LessonModule {
  id: string;
  title: string;
  panelNumber: string;
  subtitle: string;
  description: string;
  learningPoints: string[];
  code: string;
}

export const MODULES: LessonModule[] = [
  {
    id: 'full_game',
    title: '🎮 Full Game: Petualangan & Battle',
    panelNumber: 'Panel 1-5',
    subtitle: 'Semua Fitur Terintegrasi: Eksplorasi, Toko, Safe Zone, Ambush & Pertarungan',
    description: 'Game JRPG lengkap dengan grafis 16-bit HD Pixel Art: pergerakan party 4 karakter, interaksi toko senjata, pemulihan HP di kedai makanan, cutscene penyergapan penjahat, dan sistem pertarungan turn-based klasik.',
    learningPoints: [
      'Rendering Pixel Art Otentik (pixelArt: true, roundPixels: true)',
      'Algoritma riwayat koordinat (Trail History Queue) untuk follower party',
      'Deteksi jarak interaksi (Proximity Distance & Action Key)',
      'Sistem Partikel WebGL untuk asap panggangan dan percikan tempa besi',
      'Transisi kamera & Cutscene penyergapan (Ambush Sequence)',
      'State Machine Pertarungan Turn-Based (Attack, Magic, Item, Run) & Sintesis Audio Web Audio API'
    ],
    code: `// ============================================================================
// JRPG PETUALANGAN TEPI HUTAN (FOREST OUTSKIRTS) - 16-BIT HD PIXEL ART
// Sesuai Konsep: Party Follower, Toko Senjata, Kedai Safe Zone, Ambush & Turn Battle
// ============================================================================

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 480,
  backgroundColor: '#0a0d14',
  render: {
    pixelArt: true,
    roundPixels: true,
    antialias: false
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 480
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

// ----------------------------------------------------------------------------
// DATA PARTY & STATISTIK (Kaelen, Lyra, Brutus, Elara)
// ----------------------------------------------------------------------------
const party = [
  { id: 'kaelen', name: 'Kaelen', role: 'Knight', level: 14, hp: 120, maxHp: 120, mp: 30, maxMp: 30, atk: 32, def: 20 },
  { id: 'lyra',   name: 'Lyra',   role: 'Ranger', level: 13, hp: 85,  maxHp: 85,  mp: 65, maxMp: 65, atk: 24, def: 14 },
  { id: 'brutus', name: 'Brutus', role: 'Dwarf',  level: 15, hp: 150, maxHp: 150, mp: 25, maxMp: 25, atk: 36, def: 26 },
  { id: 'elara',  name: 'Elara',  role: 'Rogue',  level: 14, hp: 95,  maxHp: 95,  mp: 45, maxMp: 45, atk: 28, def: 16 }
];

let gold = 150;
let potions = 3;

// State Permainan: 'EXPLORING' | 'DIALOG' | 'SHOP' | 'AMBUSH_CUTSCENE' | 'BATTLE'
let gameState = 'EXPLORING';

// Referensi Sprite & Objek Dunia
let leaderSprite, leaderShadow;
let followers = [], followerShadows = [];
let moveHistory = [];
const HISTORY_DELAY = 14;

let cursors, wasd, keyAction, key1, key2, key3, key4;
let dialogueBox, dialogueText, interactPrompt;
let safeZoneActive = false;
let lastHealTick = 0;
let ambushTriggered = false;
let walkStep = 0;

// Referensi NPC & Elemen Lingkungan
let npcSmith, npcChef;
let lurkingBandits = [];
let bgExploration, bgBattle;
let battleContainer = null;
let currentEnemyIndex = 0;
let isPlayerTurn = true;

// Data Musuh Bandit untuk Pertarungan
const enemies = [
  { id: 'bandit_1', name: 'Bandit Archer', hp: 75, maxHp: 75, atk: 18, spriteKey: 'bandit_1', scale: 0.28 },
  { id: 'bandit_2', name: 'Bandit Dual',   hp: 90, maxHp: 90, atk: 22, spriteKey: 'bandit_2', scale: 0.28 },
  { id: 'bandit_3', name: 'Shadow Rogue',  hp: 80, maxHp: 80, atk: 20, spriteKey: 'bandit_3', scale: 0.28 },
  { id: 'bandit_4', name: 'Bandit Leader', hp: 130, maxHp: 130, atk: 26, spriteKey: 'bandit_4', scale: 0.32 }
];

// Audio Synthesizer 16-Bit Retro (Web Audio API)
const Sfx = {
  ctx: null,
  init() {
    try {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch(e) {}
  },
  playStep() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120 + Math.random() * 30, this.ctx.currentTime);
    g.gain.setValueAtTime(0.03, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.04);
  },
  playHammer() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.08);
  },
  playHeal() {
    if (!this.ctx) return;
    [523, 659, 784, 1046].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.07);
      g.gain.setValueAtTime(0.09, this.ctx.currentTime + idx * 0.07);
      g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + (idx + 1) * 0.07);
      osc.connect(g); g.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.07);
      osc.stop(this.ctx.currentTime + (idx + 1) * 0.07);
    });
  },
  playSlash() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.15);
    g.gain.setValueAtTime(0.16, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.15);
  },
  playMagic() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.28);
    g.gain.setValueAtTime(0.14, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.28);
  },
  playAlert() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(650, this.ctx.currentTime);
    osc.frequency.setValueAtTime(980, this.ctx.currentTime + 0.09);
    g.gain.setValueAtTime(0.18, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(); osc.stop(this.ctx.currentTime + 0.25);
  },
  playVictory() {
    if (!this.ctx) return;
    [523, 659, 784, 1046, 1174, 1318].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
      g.gain.setValueAtTime(0.14, this.ctx.currentTime + idx * 0.12);
      g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + (idx + 1) * 0.12);
      osc.connect(g); g.connect(this.ctx.destination);
      osc.start(this.ctx.currentTime + idx * 0.12);
      osc.stop(this.ctx.currentTime + (idx + 1) * 0.12);
    });
  }
};

// ----------------------------------------------------------------------------
// PRELOAD: MUAT ASET 16-BIT HD PIXEL ART
// ----------------------------------------------------------------------------
function preload() {
  // Backgrounds
  this.load.image('bg_forest', '/assets/bg/forest_outskirts.jpg');
  this.load.image('bg_battle', '/assets/bg/battle_arena.jpg');

  // Party Sprites
  this.load.image('sprite_kaelen', '/assets/sprites/kaelen.png');
  this.load.image('sprite_lyra',   '/assets/sprites/lyra.png');
  this.load.image('sprite_brutus', '/assets/sprites/brutus.png');
  this.load.image('sprite_elara',  '/assets/sprites/elara.png');

  // NPC Sprites
  this.load.image('npc_smith', '/assets/sprites/npc_blacksmith.png');
  this.load.image('npc_chef',  '/assets/sprites/npc_chef.png');

  // Bandit Enemy Sprites
  this.load.image('bandit_1', '/assets/sprites/bandit_archer.png');
  this.load.image('bandit_2', '/assets/sprites/bandit_dual.png');
  this.load.image('bandit_3', '/assets/sprites/bandit_shadow.png');
  this.load.image('bandit_4', '/assets/sprites/bandit_leader.png');

  // Character Face Portraits (Berbingkai Emas Retro)
  this.load.image('portrait_kaelen', '/assets/portraits/kaelen.png');
  this.load.image('portrait_lyra',   '/assets/portraits/lyra.png');
  this.load.image('portrait_brutus', '/assets/portraits/brutus.png');
  this.load.image('portrait_elara',  '/assets/portraits/elara.png');

  // Partikel Procedural (Smoke, Heart, Dust, Sparks)
  const g = this.make.graphics({ x: 0, y: 0, add: false });

  // Smoke particle
  g.clear();
  g.fillStyle(0xcfd8dc, 0.7); g.fillCircle(4, 4, 4);
  g.generateTexture('p_smoke', 8, 8);

  // Heart particle
  g.clear();
  g.fillStyle(0xef4444);
  g.fillCircle(3, 3, 3); g.fillCircle(7, 3, 3);
  g.fillTriangle(0, 4, 10, 4, 5, 10);
  g.generateTexture('p_heart', 11, 11);

  // Sparks particle
  g.clear();
  g.fillStyle(0xfbbf24); g.fillRect(1, 1, 3, 3);
  g.generateTexture('p_spark', 5, 5);

  // Dust particle
  g.clear();
  g.fillStyle(0xa8a29e, 0.5); g.fillCircle(2, 2, 2);
  g.generateTexture('p_dust', 4, 4);
}

// ----------------------------------------------------------------------------
// CREATE: INISIALISASI DUNIA JRPG & ENTITAS
// ----------------------------------------------------------------------------
function create() {
  const scene = this;
  const unlockAudio = () => { Sfx.init(); };
  this.input.on('pointerdown', unlockAudio);
  this.input.keyboard.on('keydown', unlockAudio);

  // 1. Background Eksplorasi Tepi Hutan Senja (16-bit HD Pixel Art)
  bgExploration = this.add.image(400, 240, 'bg_forest').setDisplaySize(800, 480).setDepth(0);

  // Pencahayaan Ambien Senja Hangat (Warm Twilight Vignette)
  const ambientWarmth = this.add.rectangle(400, 240, 800, 480, 0xf97316, 0.04).setBlendMode('ADD').setDepth(2);

  // Lentera & Panggangan Api (Dynamic Glow)
  const glowGrill = this.add.circle(588, 320, 40, 0xf97316, 0.22).setBlendMode('ADD').setDepth(10);
  this.tweens.add({ targets: glowGrill, scale: 1.25, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 });

  // 2. Partikel Asap Panggangan Makanan (Panel 3)
  this.add.particles(588, 305, 'p_smoke', {
    speedY: { min: -28, max: -50 },
    speedX: { min: -4, max: 10 },
    scale: { start: 0.7, end: 1.8 },
    alpha: { start: 0.65, end: 0 },
    lifespan: 1600,
    frequency: 320
  }).setDepth(15);

  // Partikel Debu Langkah & Hati Penyembuhan
  scene.dustEmitter = this.add.particles(0, 0, 'p_dust', {
    speedY: { min: -10, max: -20 },
    speedX: { min: -15, max: 15 },
    scale: { start: 0.8, end: 0.1 },
    alpha: { start: 0.5, end: 0 },
    lifespan: 250,
    emitting: false
  }).setDepth(18);

  scene.healEmitter = this.add.particles(0, 0, 'p_heart', {
    speedY: { min: -35, max: -65 },
    scale: { start: 0.9, end: 0.3 },
    alpha: { start: 1, end: 0 },
    lifespan: 1100,
    emitting: false
  }).setDepth(100);

  // 3. NPC Toko Senjata: Pandai Besi Kurcaci (Panel 2)
  // Menempa di depan tenda senjata dengan anvil & percikan api
  npcSmith = this.add.sprite(220, 318, 'npc_smith').setDisplaySize(48, 68).setDepth(15);
  const anvilSparks = this.add.particles(206, 335, 'p_spark', {
    speed: { min: 25, max: 60 },
    angle: { min: 220, max: 320 },
    gravityY: 120,
    scale: { start: 1, end: 0.2 },
    lifespan: 350,
    frequency: 800
  }).setDepth(16);

  this.tweens.add({
    targets: npcSmith,
    y: 315,
    duration: 400,
    yoyo: true,
    repeat: -1,
    onYoyo: () => {
      if (Math.abs(leaderSprite?.x - 220) < 180) Sfx.playHammer();
    }
  });

  // Label Toko Senjata
  this.add.text(220, 275, '🛡️ TOKO SENJATA', {
    fontSize: '9px', color: '#fde047', fontFamily: 'monospace', fontStyle: 'bold',
    backgroundColor: '#1e293b', padding: { x: 4, y: 2 }
  }).setOrigin(0.5).setDepth(15);

  // 4. NPC Kedai Makanan: Koki Ramah (Panel 3)
  npcChef = this.add.sprite(645, 312, 'npc_chef').setDisplaySize(42, 68).setDepth(15);
  this.tweens.add({ targets: npcChef, y: 310, duration: 650, yoyo: true, repeat: -1 });

  // Label Kedai Makanan
  this.add.text(645, 272, '🍖 KEDAI MAKANAN (SAFE ZONE)', {
    fontSize: '9px', color: '#86efac', fontFamily: 'monospace', fontStyle: 'bold',
    backgroundColor: '#14532d', padding: { x: 4, y: 2 }
  }).setOrigin(0.5).setDepth(15);

  // 5. Semak-Semak & 4 Bandit Mengintip (Panel 4)
  const ambushPositions = [
    { x: 725, y: 335, key: 'bandit_1', scale: 0.16 },
    { x: 745, y: 325, key: 'bandit_2', scale: 0.17 },
    { x: 765, y: 338, key: 'bandit_3', scale: 0.16 },
    { x: 782, y: 320, key: 'bandit_4', scale: 0.18 }
  ];

  ambushPositions.forEach(pos => {
    const bandit = scene.add.sprite(pos.x, pos.y, pos.key).setScale(pos.scale).setDepth(12);
    // Mata merah menyala berdenyut di dalam semak
    const eyeGlow = scene.add.circle(pos.x - 2, pos.y - 12, 4, 0xef4444, 0.7).setBlendMode('ADD').setDepth(13);
    scene.tweens.add({ targets: eyeGlow, alpha: 0.1, duration: 400 + Math.random() * 300, yoyo: true, repeat: -1 });
    scene.tweens.add({ targets: bandit, y: pos.y - 4, duration: 700 + Math.random() * 300, yoyo: true, repeat: -1 });
    lurkingBandits.push({ sprite: bandit, glow: eyeGlow });
  });

  // 6. Spawn Party (Kaelen Leader + 3 Followers) Beresolusi Tinggi
  leaderShadow = this.add.ellipse(140, 396, 28, 9, 0x000000, 0.45).setDepth(19);
  leaderSprite = this.physics.add.sprite(140, 365, 'sprite_kaelen').setDisplaySize(44, 66).setDepth(20);
  leaderSprite.setCollideWorldBounds(true);

  const followerDefs = [
    { id: 'lyra',   name: 'Lyra',   spriteKey: 'sprite_lyra',   w: 40, h: 64 },
    { id: 'brutus', name: 'Brutus', spriteKey: 'sprite_brutus', w: 46, h: 62 },
    { id: 'elara',  name: 'Elara',  spriteKey: 'sprite_elara',  w: 40, h: 64 }
  ];

  followers = [];
  followerShadows = [];
  followerDefs.forEach((def, idx) => {
    const startX = 140 - (idx + 1) * 32;
    const shadow = scene.add.ellipse(startX, 396, 26, 8, 0x000000, 0.4).setDepth(19);
    const sprite = scene.add.sprite(startX, 365, def.spriteKey).setDisplaySize(def.w, def.h).setDepth(20);
    followers.push(sprite);
    followerShadows.push(shadow);
  });

  // Isi awal riwayat jejak jalan (Trail Queue)
  for (let i = 0; i < HISTORY_DELAY * 4; i++) {
    moveHistory.push({ x: 140, y: 365, flipX: false });
  }

  // 7. Buat Top HUD Berbingkai Emas & Radar Minimap (Sesuai Referensi)
  createPartyHUD(this);

  // 8. Buat Dialog Box & Prompt Interaksi
  createDialogueUI(this);

  // Kontrol Keyboard
  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D
  });

  keyAction = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
  key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
  key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
  key4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
}

// ----------------------------------------------------------------------------
// UPDATE: LOGIKA PERGERAKAN, FOLLOWER TRAIL, INTERAKSI & AMBUSH
// ----------------------------------------------------------------------------
function update(time, delta) {
  if (gameState === 'BATTLE') return;

  // Interaksi Toko / Tutup Dialog
  if (Phaser.Input.Keyboard.JustDown(keyAction)) {
    if (gameState === 'DIALOG' || gameState === 'SHOP') {
      closeDialogue();
    } else if (gameState === 'EXPLORING') {
      checkInteractionTrigger(this);
    }
  }

  // Hotkey Pembelian di Toko Senjata (1: Pedang, 2: Kapak, 3: Perisai)
  if (gameState === 'SHOP') {
    if (Phaser.Input.Keyboard.JustDown(key1)) buyWeapon(1, this);
    if (Phaser.Input.Keyboard.JustDown(key2)) buyWeapon(2, this);
    if (Phaser.Input.Keyboard.JustDown(key3)) buyWeapon(3, this);
  }

  if (gameState !== 'EXPLORING') {
    leaderSprite.setVelocity(0, 0);
    return;
  }

  // Pergerakan Kaelen (WASD & Panah)
  const speed = 165;
  let vx = 0, vy = 0;

  if (cursors.left.isDown || wasd.left.isDown) vx = -speed;
  else if (cursors.right.isDown || wasd.right.isDown) vx = speed;

  if (cursors.up.isDown || wasd.up.isDown) vy = -speed * 0.7;
  else if (cursors.down.isDown || wasd.down.isDown) vy = speed * 0.7;

  leaderSprite.setVelocity(vx, vy);

  // Batasi jalur jalan tanah (Y: 345 s/d 400)
  leaderSprite.y = Phaser.Math.Clamp(leaderSprite.y, 345, 400);
  leaderShadow.x = leaderSprite.x;
  leaderShadow.y = leaderSprite.y + 31;

  const isMoving = vx !== 0 || vy !== 0;

  if (isMoving) {
    walkStep += delta * 0.015;
    // Animasi Langkah Kaki (Bobbing Vertikal Halus)
    const bob = Math.sin(walkStep * 6) * 2.5;
    leaderSprite.y += bob;

    if (Math.sin(walkStep * 6) > 0.9) Sfx.playStep();

    // Partikel Debu
    if (Math.random() < 0.25) {
      this.dustEmitter.emitParticleAt(leaderSprite.x, leaderSprite.y + 30);
    }

    if (vx < 0) leaderSprite.setFlipX(true);
    else if (vx > 0) leaderSprite.setFlipX(false);

    // LOGIKA FOLLOWER TRAIL QUEUE: Simpan posisi terdepan
    moveHistory.unshift({ x: leaderSprite.x, y: leaderSprite.y - bob, flipX: leaderSprite.flipX });
    if (moveHistory.length > HISTORY_DELAY * 4) moveHistory.pop();
  }

  // Perbarui Posisi Para Pengikut (Lyra, Brutus, Elara)
  followers.forEach((follower, index) => {
    const historyIndex = (index + 1) * HISTORY_DELAY;
    if (moveHistory[historyIndex]) {
      const target = moveHistory[historyIndex];
      follower.x = target.x;
      const followerBob = isMoving ? Math.sin(walkStep * 6 - (index + 1)) * 2 : 0;
      follower.y = target.y + followerBob;
      follower.setFlipX(target.flipX);

      followerShadows[index].x = follower.x;
      followerShadows[index].y = target.y + 31;
    }
  });

  // Cek Zona Aman Kedai Makanan (Panel 3: Safe Zone Rest & Heal)
  checkFoodSafeZone(this, time);

  // Cek Penyergapan Bandit di Ujung Kanan (Panel 4: Ambush Alert)
  checkAmbushTrigger(this);

  // Perbarui Ikon Party di Minimap
  updateMinimapRadar();
}

// ----------------------------------------------------------------------------
// FITUR PANEL 2: INTERAKSI TOKO SENJATA & PEMBELIAN ITEM
// ----------------------------------------------------------------------------
function checkInteractionTrigger(scene) {
  const distSmith = Phaser.Math.Distance.Between(leaderSprite.x, leaderSprite.y, npcSmith.x, npcSmith.y);
  const distChef = Phaser.Math.Distance.Between(leaderSprite.x, leaderSprite.y, npcChef.x, npcChef.y);

  if (distSmith < 85) {
    gameState = 'SHOP';
    openDialogue(
      'Pandai Besi Kurcaci (Dwarf Smith)',
      'Selamat datang di tepi hutan! Tempaan kami yang terkuat di kerajaan.\\n' +
      '[1] Pedang Ksatria Baja (+15 ATK) - 50 Gold\\n' +
      '[2] Kapak Tempur Kurcaci (+25 ATK) - 80 Gold\\n' +
      '[3] Perisai Penjaga (+12 DEF) - 45 Gold\\n' +
      '(Tekan 1/2/3 untuk beli, SPASI untuk selesai belanja)'
    );
  } else if (distChef < 85) {
    gameState = 'DIALOG';
    openDialogue(
      'Koki Kedai Makanan',
      'Halo para petualang! Istirahatlah sejenak di dekat kedai kami.\\n' +
      'Aroma sate panggang ini memulihkan HP & MP party secara otomatis! Hati-hati dengan semak di sebelah timur...'
    );
  }
}

function buyWeapon(itemType, scene) {
  let cost = 0, name = '', atkBonus = 0;
  if (itemType === 1) { cost = 50; name = 'Pedang Ksatria Baja'; atkBonus = 15; }
  else if (itemType === 2) { cost = 80; name = 'Kapak Tempur Kurcaci'; atkBonus = 25; }
  else if (itemType === 3) { cost = 45; name = 'Perisai Penjaga'; party[0].def += 12; }

  if (gold >= cost) {
    gold -= cost;
    if (atkBonus > 0) party[0].atk += atkBonus;
    Sfx.playVictory();
    updateDialogueText(
      'Pandai Besi Kurcaci',
      'Terima kasih! ' + name + ' kini menjadi milikmu! Sisa Gold: ' + gold + ' G.\\n' +
      'Kaelen ATK: ' + party[0].atk + ' | DEF: ' + party[0].def + '\\n(Tekan 1/2/3 lagi atau SPASI untuk tutup)'
    );
    updatePartyHUDVisuals();
  } else {
    Sfx.playSlash();
    updateDialogueText(
      'Pandai Besi Kurcaci',
      'Gold kamu tidak cukup! Kamu butuh ' + cost + ' G, tapi hanya punya ' + gold + ' G.\\n(Tekan SPASI untuk tutup)'
    );
  }
}

// ----------------------------------------------------------------------------
// FITUR PANEL 3: SAFE ZONE KEDAI MAKANAN (REGENERASI HP/MP & PARTIKEL HATI)
// ----------------------------------------------------------------------------
function checkFoodSafeZone(scene, time) {
  const distChef = Phaser.Math.Distance.Between(leaderSprite.x, leaderSprite.y, npcChef.x, npcChef.y);

  if (distChef < 110) {
    if (!safeZoneActive) {
      safeZoneActive = true;
      interactPrompt.setText('✨ Zona Aman Kedai: Memulihkan HP/MP Party').setVisible(true);
    }

    if (time - lastHealTick > 1400) {
      lastHealTick = time;
      let healed = false;
      party.forEach(hero => {
        if (hero.hp < hero.maxHp || hero.mp < hero.maxMp) {
          hero.hp = Math.min(hero.maxHp, hero.hp + 12);
          hero.mp = Math.min(hero.maxMp, hero.mp + 8);
          healed = true;
        }
      });

      if (healed) {
        Sfx.playHeal();
        scene.healEmitter.emitParticleAt(leaderSprite.x, leaderSprite.y - 10, 3);
        followers.forEach(f => scene.healEmitter.emitParticleAt(f.x, f.y - 10, 2));
        updatePartyHUDVisuals();

        // Teks Floating Healing
        showFloatingText(scene, leaderSprite.x, leaderSprite.y - 35, '+12 HP  +8 MP', '#86efac');
      }
    }
  } else {
    if (safeZoneActive) {
      safeZoneActive = false;
      interactPrompt.setVisible(false);
    }
  }
}

// ----------------------------------------------------------------------------
// FITUR PANEL 4: AMBUSH ALERT CUTSCENE (PENYERGAPAN PENJAHAT)
// ----------------------------------------------------------------------------
function checkAmbushTrigger(scene) {
  if (ambushTriggered) return;

  // Jika party mendekati semak-semak di sisi timur (X > 660)
  if (leaderSprite.x > 660) {
    ambushTriggered = true;
    gameState = 'AMBUSH_CUTSCENE';
    leaderSprite.setVelocity(0, 0);

    Sfx.playAlert();

    // 1. Munculkan Tanda Seru (!) Bouncing di atas kepala seluruh party
    const alertIcons = [];
    const partySprites = [leaderSprite, ...followers];
    partySprites.forEach((heroSprite, i) => {
      const alert = scene.add.text(heroSprite.x, heroSprite.y - 50, '❗', {
        fontSize: '22px'
      }).setOrigin(0.5).setDepth(200);

      scene.tweens.add({
        targets: alert,
        y: heroSprite.y - 65,
        duration: 250,
        yoyo: true,
        repeat: 2,
        delay: i * 80
      });
      alertIcons.push(alert);
    });

    // 2. Kamera Bergetar & Layar Menggelap ke Nuansa Bahaya (Suspense Color Shift)
    scene.cameras.main.shake(400, 0.012);
    const dangerOverlay = scene.add.rectangle(400, 240, 800, 480, 0x1e1b4b, 0.45).setDepth(150);

    // 3. Bandit Melompat Keluar dari Semak ke Tengah Jalan
    lurkingBandits.forEach((item, idx) => {
      scene.tweens.add({
        targets: item.sprite,
        x: 640 - idx * 45,
        y: 365,
        scale: 0.28,
        duration: 500,
        ease: 'Back.easeOut'
      });
      item.glow.destroy();
    });

    // 4. Transisi Masuk Mode Battle (Panel 5) setelah cutscene 1.2 detik
    scene.time.delayedCall(1200, () => {
      alertIcons.forEach(a => a.destroy());
      dangerOverlay.destroy();
      startBattleSequence(scene);
    });
  }
}

// ----------------------------------------------------------------------------
// FITUR PANEL 5: SISTEM PERTARUNGAN TURN-BASED (BATTLE MODE)
// ----------------------------------------------------------------------------
let battlePartySprites = [];
let battleEnemySprites = [];
let battleLogText = null;

function startBattleSequence(scene) {
  gameState = 'BATTLE';

  // Efek Screen Flash / Pixel Shatter Transition
  scene.cameras.main.flash(450, 255, 255, 255);

  // Buat Container Khusus Pertarungan
  battleContainer = scene.add.container(0, 0).setDepth(500);

  // 1. Background Arena Pertarungan Malam Hari (16-bit HD Pixel Art)
  bgBattle = scene.add.image(400, 240, 'bg_battle').setDisplaySize(800, 480);
  battleContainer.add(bgBattle);

  // 2. Spawn Formasi Battle Party di Sisi Kiri
  battlePartySprites = [];
  const partyPositions = [
    { x: 180, y: 220, key: 'sprite_kaelen', scale: 0.28 },
    { x: 130, y: 170, key: 'sprite_lyra',   scale: 0.27 },
    { x: 110, y: 290, key: 'sprite_brutus', scale: 0.29 },
    { x: 70,  y: 225, key: 'sprite_elara',  scale: 0.27 }
  ];

  partyPositions.forEach((pos, i) => {
    // Shadow
    const sh = scene.add.ellipse(pos.x, pos.y + 40, 36, 12, 0x000000, 0.45);
    const heroSprite = scene.add.sprite(pos.x, pos.y, pos.key).setScale(pos.scale);
    // Battle idle bounce
    scene.tweens.add({ targets: heroSprite, y: pos.y - 4, duration: 600 + i * 80, yoyo: true, repeat: -1 });

    battleContainer.add([sh, heroSprite]);
    battlePartySprites.push(heroSprite);
  });

  // 3. Spawn 4 Bandit Musuh di Sisi Kiri / Kanan Mengepung
  battleEnemySprites = [];
  const enemyPositions = [
    { x: 550, y: 180, key: 'bandit_1', scale: 0.26 },
    { x: 620, y: 230, key: 'bandit_2', scale: 0.27 },
    { x: 540, y: 310, key: 'bandit_3', scale: 0.26 },
    { x: 690, y: 250, key: 'bandit_4', scale: 0.32 }
  ];

  enemies.forEach((enemy, i) => {
    const pos = enemyPositions[i];
    const sh = scene.add.ellipse(pos.x, pos.y + 42, 38, 12, 0x000000, 0.45);
    const sprite = scene.add.sprite(pos.x, pos.y, pos.key).setScale(pos.scale).setFlipX(true);
    scene.tweens.add({ targets: sprite, y: pos.y - 5, duration: 700 + i * 90, yoyo: true, repeat: -1 });

    // Bar HP di atas kepala musuh
    const hpBarBg = scene.add.rectangle(pos.x, pos.y - 45, 48, 6, 0x450a0a);
    const hpBarFill = scene.add.rectangle(pos.x - 24, pos.y - 45, 48, 6, 0xef4444).setOrigin(0, 0.5);
    const nameLabel = scene.add.text(pos.x, pos.y - 56, enemy.name, {
      fontSize: '8px', color: '#f8fafc', fontFamily: 'monospace'
    }).setOrigin(0.5);

    battleContainer.add([sh, sprite, hpBarBg, hpBarFill, nameLabel]);
    battleEnemySprites.push({ sprite, hpBarFill, enemy, hpBarBg, nameLabel });
  });

  // 4. Panel UI Menu Pertarungan Bawah (Retro Command Window)
  const menuBox = scene.add.rectangle(400, 425, 760, 95, 0x090d16, 0.95);
  menuBox.setStrokeStyle(2.5, 0xe2e8f0);

  battleLogText = scene.add.text(45, 388, '⚔️ KELOMPOK BANDIT MENYERANG! Pilih Perintah Kaelen & Party:', {
    fontSize: '11px', color: '#fde047', fontFamily: 'monospace', fontStyle: 'bold'
  });

  const cmdAttack = scene.add.text(60, 420, '[1] ATTACK ⚔️', { fontSize: '13px', color: '#f8fafc', fontFamily: 'monospace', fontStyle: 'bold' });
  const cmdMagic  = scene.add.text(230, 420, '[2] MAGIC ✨ (15 MP)', { fontSize: '13px', color: '#67e8f9', fontFamily: 'monospace', fontStyle: 'bold' });
  const cmdItem   = scene.add.text(430, 420, '[3] ITEM 🧪 (' + potions + ' Potion)', { fontSize: '13px', color: '#86efac', fontFamily: 'monospace', fontStyle: 'bold' });
  const cmdRun    = scene.add.text(620, 420, '[4] RUN 🏃', { fontSize: '13px', color: '#cbd5e1', fontFamily: 'monospace', fontStyle: 'bold' });

  battleContainer.add([menuBox, battleLogText, cmdAttack, cmdMagic, cmdItem, cmdRun]);

  // Listener Tombol Pertarungan (1, 2, 3, 4)
  const handleBattleInput = (e) => {
    if (gameState !== 'BATTLE' || !isPlayerTurn) return;

    if (e.code === 'Digit1') executePlayerAttack(scene);
    else if (e.code === 'Digit2') executePlayerMagic(scene);
    else if (e.code === 'Digit3') executePlayerItem(scene);
    else if (e.code === 'Digit4') executePlayerRun(scene);
  };

  window.addEventListener('keydown', handleBattleInput);
  scene.events.once('shutdown', () => window.removeEventListener('keydown', handleBattleInput));
}

// Eksekusi Serangan Fisik
function executePlayerAttack(scene) {
  isPlayerTurn = false;
  Sfx.playSlash();

  const target = battleEnemySprites.find(item => item.enemy.hp > 0);
  if (!target) return handleVictory(scene);

  const heroSprite = battlePartySprites[0];
  scene.tweens.add({
    targets: heroSprite,
    x: target.sprite.x - 50,
    duration: 180,
    yoyo: true,
    onYoyo: () => {
      // Efek Tebasan Visual
      scene.cameras.main.shake(120, 0.008);
      const dmg = Math.floor(party[0].atk * (0.9 + Math.random() * 0.3));
      target.enemy.hp = Math.max(0, target.enemy.hp - dmg);
      target.hpBarFill.width = 48 * (target.enemy.hp / target.enemy.maxHp);

      showFloatingText(scene, target.sprite.x, target.sprite.y - 20, '-' + dmg, '#ef4444');
      battleLogText.setText('💥 Kaelen menebas ' + target.enemy.name + ' sebesar ' + dmg + ' Damage!');

      if (target.enemy.hp <= 0) {
        target.sprite.setTint(0x333333).setAlpha(0.4);
        battleLogText.setText('💀 ' + target.enemy.name + ' K.O.!');
      }
    },
    onComplete: () => {
      checkBattleStateOrEnemyTurn(scene);
    }
  });
}

// Eksekusi Sihir Lyra (Fireball / Meteor)
function executePlayerMagic(scene) {
  if (party[1].mp < 15) {
    battleLogText.setText('❌ MP Lyra tidak cukup (Butuh 15 MP)!');
    return;
  }

  isPlayerTurn = false;
  party[1].mp -= 15;
  updatePartyHUDVisuals();
  Sfx.playMagic();

  battleLogText.setText('✨ Lyra merapal sihir Badai Petir Hutan ke semua musuh!');

  battleEnemySprites.forEach((item, idx) => {
    if (item.enemy.hp > 0) {
      scene.time.delayedCall(idx * 120, () => {
        const dmg = 35 + Math.floor(Math.random() * 15);
        item.enemy.hp = Math.max(0, item.enemy.hp - dmg);
        item.hpBarFill.width = 48 * (item.enemy.hp / item.enemy.maxHp);
        showFloatingText(scene, item.sprite.x, item.sprite.y - 20, '⚡ -' + dmg, '#67e8f9');
        if (item.enemy.hp <= 0) item.sprite.setTint(0x333333).setAlpha(0.4);
      });
    }
  });

  scene.time.delayedCall(700, () => {
    checkBattleStateOrEnemyTurn(scene);
  });
}

// Eksekusi Penggunaan Potion
function executePlayerItem(scene) {
  if (potions <= 0) {
    battleLogText.setText('❌ Potion kamu habis!');
    return;
  }

  isPlayerTurn = false;
  potions--;
  Sfx.playHeal();
  party.forEach(hero => {
    hero.hp = Math.min(hero.maxHp, hero.hp + 45);
  });
  updatePartyHUDVisuals();
  battleLogText.setText('🧪 Menggunakan Elixir Potion! Seluruh party pulih +45 HP! Sisa: ' + potions);

  scene.time.delayedCall(800, () => {
    checkBattleStateOrEnemyTurn(scene);
  });
}

// Eksekusi Kabur (Run)
function executePlayerRun(scene) {
  battleLogText.setText('💨 Party berhasil mundur dengan selamat ke zona aman!');
  scene.time.delayedCall(800, () => {
    exitBattle(scene);
  });
}

// Giliran Musuh Menyerang
function checkBattleStateOrEnemyTurn(scene) {
  const aliveEnemies = battleEnemySprites.filter(item => item.enemy.hp > 0);
  if (aliveEnemies.length === 0) {
    return handleVictory(scene);
  }

  // Giliran Bandit Menyerang
  scene.time.delayedCall(600, () => {
    const attacker = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    const targetHero = party[Math.floor(Math.random() * party.length)];
    const dmg = Math.max(5, attacker.enemy.atk - Math.floor(targetHero.def * 0.5));

    Sfx.playSlash();
    scene.tweens.add({
      targets: attacker.sprite,
      x: attacker.sprite.x - 40,
      duration: 150,
      yoyo: true,
      onYoyo: () => {
        targetHero.hp = Math.max(1, targetHero.hp - dmg);
        updatePartyHUDVisuals();
        showFloatingText(scene, 180, 200, '-' + dmg + ' HP', '#ef4444');
        battleLogText.setText('⚔️ ' + attacker.enemy.name + ' menyerang ' + targetHero.name + ' sebesar ' + dmg + ' DMG!');
      },
      onComplete: () => {
        isPlayerTurn = true;
      }
    });
  });
}

// Kemenangan Pertempuran
function handleVictory(scene) {
  Sfx.playVictory();
  gold += 80;
  battleLogText.setText('🎉 VICTORY! Seluruh Bandit dikalahkan! EXP +120 | Gold +80 G diperoleh!');
  updatePartyHUDVisuals();

  scene.time.delayedCall(2200, () => {
    exitBattle(scene);
  });
}

function exitBattle(scene) {
  if (battleContainer) {
    battleContainer.destroy();
    battleContainer = null;
  }
  gameState = 'EXPLORING';
  leaderSprite.setPosition(520, 375);
  followers.forEach((f, idx) => f.setPosition(520 - (idx + 1) * 32, 375));
  moveHistory = [];
  for (let i = 0; i < HISTORY_DELAY * 4; i++) {
    moveHistory.push({ x: 520, y: 375, flipX: false });
  }
  ambushTriggered = false;
  scene.cameras.main.flash(300, 255, 255, 255);
}

// ----------------------------------------------------------------------------
// TOP HUD BERBINGKAI EMAS RETRO & RADAR MINIMAP (SESUAI GAMBAR REFERENSI)
// ----------------------------------------------------------------------------
let hudPartyBars = [];
let radarPartyDot = null;

function createPartyHUD(scene) {
  // 4 Kotak Status Karakter di Sisi Kiri-Tengah Atas
  const portraitsMap = {
    kaelen: 'portrait_kaelen',
    lyra:   'portrait_lyra',
    brutus: 'portrait_brutus',
    elara:  'portrait_elara'
  };

  party.forEach((hero, i) => {
    const x = 12 + i * 144;
    const y = 10;

    // Bingkai Luar Kotak Karakter (Ornate Dark Blue Border)
    const cardBg = scene.add.rectangle(x + 68, y + 21, 138, 42, 0x090d16, 0.92).setDepth(100);
    cardBg.setStrokeStyle(1.5, 0x475569);

    // Mini Portrait Karakter dengan Bingkai Emas
    const portraitKey = portraitsMap[hero.id];
    scene.add.image(x + 18, y + 21, portraitKey).setDisplaySize(28, 36).setDepth(101);

    // Info Nama & Level
    scene.add.text(x + 36, y + 4, hero.name, {
      fontSize: '10px', color: '#f8fafc', fontFamily: 'monospace', fontStyle: 'bold'
    }).setDepth(101);

    scene.add.text(x + 98, y + 4, 'Lv.' + hero.level, {
      fontSize: '8px', color: '#fde047', fontFamily: 'monospace'
    }).setDepth(101);

    // Bar HP
    scene.add.text(x + 36, y + 17, 'HP', { fontSize: '8px', color: '#f87171', fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(101);
    scene.add.rectangle(x + 88, y + 20, 74, 5, 0x450a0a).setDepth(101);
    const hpFill = scene.add.rectangle(x + 51, y + 20, 74, 5, 0x22c55e).setOrigin(0, 0.5).setDepth(102);

    // Bar MP
    scene.add.text(x + 36, y + 27, 'MP', { fontSize: '8px', color: '#60a5fa', fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(101);
    scene.add.rectangle(x + 88, y + 30, 74, 4, 0x172554).setDepth(101);
    const mpFill = scene.add.rectangle(x + 51, y + 30, 74, 4, 0x38bdf8).setOrigin(0, 0.5).setDepth(102);

    hudPartyBars.push({ hero, hpFill, mpFill });
  });

  // Radar Minimap di Pojok Kanan Atas
  const mapX = 725, mapY = 32;
  const miniMapBg = scene.add.rectangle(mapX, mapY, 116, 44, 0x090d16, 0.95).setDepth(100);
  miniMapBg.setStrokeStyle(1.5, 0x64748b);

  scene.add.text(mapX - 52, mapY - 18, 'MAP: FOREST', { fontSize: '8px', color: '#94a3b8', fontFamily: 'monospace' }).setDepth(101);
  scene.add.text(mapX + 12, mapY - 18, '🪙 ' + gold + 'G', { fontSize: '8px', color: '#fde047', fontFamily: 'monospace', fontStyle: 'bold' }).setDepth(101);

  // Ikon-Ikon Radar
  scene.add.rectangle(mapX - 25, mapY + 6, 7, 7, 0xef4444).setDepth(101); // Toko Senjata
  scene.add.rectangle(mapX + 10, mapY + 6, 7, 7, 0x22c55e).setDepth(101); // Kedai Makanan
  scene.add.rectangle(mapX + 42, mapY + 6, 7, 7, 0xf59e0b).setDepth(101); // Area Ambush

  radarPartyDot = scene.add.circle(mapX - 45, mapY + 6, 3.5, 0x38bdf8).setDepth(102);
}

function updateMinimapRadar() {
  if (!radarPartyDot || !leaderSprite) return;
  const mapX = 725;
  const relativeX = (leaderSprite.x / 800) * 90 - 45;
  radarPartyDot.x = mapX + relativeX;
}

function updatePartyHUDVisuals() {
  hudPartyBars.forEach(item => {
    const hpPct = Math.max(0, Math.min(1, item.hero.hp / item.hero.maxHp));
    const mpPct = Math.max(0, Math.min(1, item.hero.mp / item.hero.maxMp));
    item.hpFill.width = 74 * hpPct;
    item.mpFill.width = 74 * mpPct;
  });
}

// ----------------------------------------------------------------------------
// KOTAK DIALOG & FLOATING NUMBERS
// ----------------------------------------------------------------------------
function createDialogueUI(scene) {
  interactPrompt = scene.add.text(400, 442, '', {
    fontSize: '11px', color: '#fde047', fontFamily: 'monospace', fontStyle: 'bold',
    backgroundColor: '#090d16', padding: { x: 8, y: 4 }
  }).setOrigin(0.5).setVisible(false).setDepth(200);

  dialogueBox = scene.add.rectangle(400, 432, 750, 78, 0x090d16, 0.96).setVisible(false).setDepth(200);
  dialogueBox.setStrokeStyle(2, 0xe2e8f0);

  dialogueText = scene.add.text(50, 404, '', {
    fontSize: '11px', color: '#f8fafc', fontFamily: 'monospace', lineSpacing: 4
  }).setVisible(false).setDepth(201);
}

function openDialogue(speaker, text) {
  dialogueBox.setVisible(true);
  dialogueText.setText('[' + speaker + ']\\n' + text).setVisible(true);
  interactPrompt.setVisible(false);
}

function updateDialogueText(speaker, text) {
  dialogueText.setText('[' + speaker + ']\\n' + text);
}

function closeDialogue() {
  dialogueBox.setVisible(false);
  dialogueText.setVisible(false);
  gameState = 'EXPLORING';
}

function showFloatingText(scene, x, y, msg, color) {
  const txt = scene.add.text(x, y, msg, {
    fontSize: '12px', color: color, fontFamily: 'monospace', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(300);

  scene.tweens.add({
    targets: txt,
    y: y - 28,
    alpha: 0,
    duration: 1000,
    onComplete: () => txt.destroy()
  });
}
`
  },
  {
    id: 'module_1',
    title: '📘 Modul 1: Logika Pergerakan Party & Follower',
    panelNumber: 'Panel 1',
    subtitle: 'Scene Awal: Party Memasuki Tepi Hutan (Forest Outskirts)',
    description: 'Pelajari cara membuat pergerakan 4 karakter berbaris (Party Formation) menggunakan teknik array history queue dengan sprite 16-bit HD Pixel Art.',
    learningPoints: [
      'Logika Antrian Jejak (Trail History Queue): moveHistory.unshift({ x, y, flipX })',
      'Pengambilan jarak sampling (HISTORY_DELAY * index) agar karakter tidak bertumpuk',
      'Animasi Walk Cycle side-view bobbing & pembalikan arah sprite (setFlipX)',
      'Batasan jalur setapak dengan Phaser.Math.Clamp'
    ],
    code: `// MODUL 1: PERGERAKAN PARTY & FOLLOWER TRAIL (FOREST OUTSKIRTS)
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 480,
  backgroundColor: '#0a0d14',
  render: { pixelArt: true, roundPixels: true },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 480
  },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let leader, leaderShadow;
let followers = [], followerShadows = [];
let moveHistory = [];
const HISTORY_DELAY = 14;
let walkStep = 0;

function preload() {
  this.load.image('bg_forest', '/assets/bg/forest_outskirts.jpg');
  this.load.image('sprite_kaelen', '/assets/sprites/kaelen.png');
  this.load.image('sprite_lyra',   '/assets/sprites/lyra.png');
  this.load.image('sprite_brutus', '/assets/sprites/brutus.png');
  this.load.image('sprite_elara',  '/assets/sprites/elara.png');
}

function create() {
  this.add.image(400, 240, 'bg_forest').setDisplaySize(800, 480);

  leaderShadow = this.add.ellipse(140, 396, 28, 9, 0x000000, 0.45);
  leader = this.physics.add.sprite(140, 365, 'sprite_kaelen').setDisplaySize(44, 66);
  leader.setCollideWorldBounds(true);

  const followerKeys = [
    { key: 'sprite_lyra', w: 40, h: 64 },
    { key: 'sprite_brutus', w: 46, h: 62 },
    { key: 'sprite_elara', w: 40, h: 64 }
  ];

  followerKeys.forEach((item, idx) => {
    const startX = 140 - (idx + 1) * 32;
    const sh = this.add.ellipse(startX, 396, 26, 8, 0x000000, 0.4);
    const spr = this.add.sprite(startX, 365, item.key).setDisplaySize(item.w, item.h);
    followers.push(spr);
    followerShadows.push(sh);
  });

  for (let i = 0; i < HISTORY_DELAY * 4; i++) {
    moveHistory.push({ x: 140, y: 365, flipX: false });
  }

  this.cursors = this.input.keyboard.createCursorKeys();
  this.add.text(20, 20, 'MODUL 1: Gunakan Tombol Panah (Panah Kiri/Kanan/Atas/Bawah) untuk Bergerak', {
    fontSize: '12px', color: '#fde047', fontFamily: 'monospace', fontStyle: 'bold',
    backgroundColor: '#090d16', padding: { x: 8, y: 4 }
  });
}

function update(time, delta) {
  const speed = 160;
  let vx = 0, vy = 0;

  if (this.cursors.left.isDown) vx = -speed;
  else if (this.cursors.right.isDown) vx = speed;

  if (this.cursors.up.isDown) vy = -speed * 0.7;
  else if (this.cursors.down.isDown) vy = speed * 0.7;

  leader.setVelocity(vx, vy);
  leader.y = Phaser.Math.Clamp(leader.y, 345, 400);
  leaderShadow.x = leader.x;
  leaderShadow.y = leader.y + 31;

  const isMoving = vx !== 0 || vy !== 0;

  if (isMoving) {
    walkStep += delta * 0.015;
    const bob = Math.sin(walkStep * 6) * 2.5;
    leader.y += bob;

    if (vx < 0) leader.setFlipX(true);
    else if (vx > 0) leader.setFlipX(false);

    moveHistory.unshift({ x: leader.x, y: leader.y - bob, flipX: leader.flipX });
    if (moveHistory.length > HISTORY_DELAY * 4) moveHistory.pop();
  }

  followers.forEach((f, idx) => {
    const target = moveHistory[(idx + 1) * HISTORY_DELAY];
    if (target) {
      f.x = target.x;
      f.y = target.y + (isMoving ? Math.sin(walkStep * 6 - (idx + 1)) * 2 : 0);
      f.setFlipX(target.flipX);
      followerShadows[idx].x = f.x;
      followerShadows[idx].y = target.y + 31;
    }
  });
}
`
  },
  {
    id: 'module_2',
    title: '🛡️ Modul 2: Interaksi Toko Senjata (Weapons Merchant)',
    panelNumber: 'Panel 2',
    subtitle: 'Tenda Pandai Besi Kurcaci & Sistem Belanja Retro',
    description: 'Pelajari cara mendeteksi jarak karakter dengan NPC pandai besi dan menampilkan jendela percakapan serta katalog senjata menggunakan tombol aksi.',
    learningPoints: [
      'Deteksi Jarak Euclidean: Phaser.Math.Distance.Between(x1, y1, x2, y2)',
      'Kotak Dialog Monokrom Retro & Speaker Tag',
      'Logika Transaksi: Cek kecukupan Gold & penambahan stat senjata'
    ],
    code: `// MODUL 2: TOKO SENJATA & INTERAKSI NPC (WEAPONS MERCHANT)
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 480,
  backgroundColor: '#0a0d14',
  render: { pixelArt: true, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 800, height: 480 },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let player, smith;
let gold = 120, atk = 28;
let inDialog = false;
let dialogBox, dialogText, promptText;

function preload() {
  this.load.image('bg_forest', '/assets/bg/forest_outskirts.jpg');
  this.load.image('sprite_kaelen', '/assets/sprites/kaelen.png');
  this.load.image('npc_smith', '/assets/sprites/npc_blacksmith.png');
}

function create() {
  this.add.image(400, 240, 'bg_forest').setDisplaySize(800, 480);

  smith = this.add.sprite(220, 318, 'npc_smith').setDisplaySize(48, 68);
  this.tweens.add({ targets: smith, y: 315, duration: 400, yoyo: true, repeat: -1 });

  this.add.text(220, 275, '🛡️ TOKO SENJATA', {
    fontSize: '9px', color: '#fde047', fontFamily: 'monospace', fontStyle: 'bold',
    backgroundColor: '#1e293b', padding: { x: 4, y: 2 }
  }).setOrigin(0.5);

  player = this.physics.add.sprite(160, 365, 'sprite_kaelen').setDisplaySize(44, 66);
  player.setCollideWorldBounds(true);

  // Dialog UI
  promptText = this.add.text(400, 440, 'Tekan [SPASI] untuk Bicara', {
    fontSize: '12px', color: '#fde047', fontFamily: 'monospace',
    backgroundColor: '#090d16', padding: { x: 8, y: 4 }
  }).setOrigin(0.5).setVisible(false);

  dialogBox = this.add.rectangle(400, 430, 750, 75, 0x090d16, 0.95).setVisible(false);
  dialogBox.setStrokeStyle(2, 0xe2e8f0);

  dialogText = this.add.text(50, 405, '', {
    fontSize: '11px', color: '#f8fafc', fontFamily: 'monospace', lineSpacing: 4
  }).setVisible(false);

  this.cursors = this.input.keyboard.createCursorKeys();
  this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);

  this.statusText = this.add.text(20, 20, 'Gold: ' + gold + ' G | ATK: ' + atk, {
    fontSize: '12px', color: '#fde047', fontFamily: 'monospace', fontStyle: 'bold',
    backgroundColor: '#090d16', padding: { x: 6, y: 3 }
  });
}

function update() {
  if (inDialog) {
    player.setVelocity(0, 0);
    if (Phaser.Input.Keyboard.JustDown(this.key1)) {
      if (gold >= 50) {
        gold -= 50;
        atk += 15;
        this.statusText.setText('Gold: ' + gold + ' G | ATK: ' + atk);
        dialogText.setText('[Pandai Besi]\\nPedang Baja berhasil dibeli (+15 ATK)! Sisa Gold: ' + gold + ' G.\\n(Tekan SPASI untuk keluar)');
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      inDialog = false;
      dialogBox.setVisible(false);
      dialogText.setVisible(false);
    }
    return;
  }

  const speed = 160;
  let vx = 0, vy = 0;
  if (this.cursors.left.isDown) vx = -speed;
  else if (this.cursors.right.isDown) vx = speed;
  if (this.cursors.up.isDown) vy = -speed * 0.7;
  else if (this.cursors.down.isDown) vy = speed * 0.7;

  player.setVelocity(vx, vy);
  player.y = Phaser.Math.Clamp(player.y, 345, 400);

  const dist = Phaser.Math.Distance.Between(player.x, player.y, smith.x, smith.y);
  if (dist < 85) {
    promptText.setVisible(true);
    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      inDialog = true;
      promptText.setVisible(false);
      dialogBox.setVisible(true);
      dialogText.setText('[Pandai Besi Kurcaci]\\nButuh senjata tangguh?\\n[1] Pedang Ksatria (+15 ATK) - 50 Gold\\n(Tekan 1 untuk Beli, SPASI untuk Batal)').setVisible(true);
    }
  } else {
    promptText.setVisible(false);
  }
}
`
  },
  {
    id: 'module_3',
    title: '🍖 Modul 3: Kedai Makanan & Safe Zone',
    panelNumber: 'Panel 3',
    subtitle: 'Pemulihan HP/MP & Partikel Asap Panggangan Sate',
    description: 'Pelajari konsep Zona Aman (Safe Zone) RPG di mana karakter memulihkan kesehatan secara bertahap saat berada di dekat kedai makanan.',
    learningPoints: [
      'Pemeriksaan Jarak Proksimitas (Safe Zone Radius Trigger)',
      'Sistem Regenerasi Stat Berkala (Tick Rate Limiting)',
      'Sistem Partikel Asap & Partikel Hati Melayang'
    ],
    code: `// MODUL 3: KEDAI MAKANAN & REST HEALING SAFE ZONE
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 480,
  backgroundColor: '#0a0d14',
  render: { pixelArt: true, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 800, height: 480 },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let player, chef;
let hp = 40, maxHp = 120;
let mp = 10, maxMp = 30;
let lastHeal = 0;
let healEmitter;

function preload() {
  this.load.image('bg_forest', '/assets/bg/forest_outskirts.jpg');
  this.load.image('sprite_kaelen', '/assets/sprites/kaelen.png');
  this.load.image('npc_chef', '/assets/sprites/npc_chef.png');

  const g = this.make.graphics({ x: 0, y: 0, add: false });
  // Smoke
  g.clear(); g.fillStyle(0xcfd8dc, 0.7); g.fillCircle(4, 4, 4);
  g.generateTexture('p_smoke', 8, 8);
  // Heart
  g.clear(); g.fillStyle(0xef4444);
  g.fillCircle(3, 3, 3); g.fillCircle(7, 3, 3); g.fillTriangle(0, 4, 10, 4, 5, 10);
  g.generateTexture('p_heart', 11, 11);
}

function create() {
  this.add.image(400, 240, 'bg_forest').setDisplaySize(800, 480);

  chef = this.add.sprite(645, 312, 'npc_chef').setDisplaySize(42, 68);
  this.tweens.add({ targets: chef, y: 310, duration: 650, yoyo: true, repeat: -1 });

  this.add.particles(588, 305, 'p_smoke', {
    speedY: { min: -25, max: -45 },
    speedX: { min: -3, max: 8 },
    scale: { start: 0.6, end: 1.6 },
    alpha: { start: 0.7, end: 0 },
    lifespan: 1500,
    frequency: 300
  });

  healEmitter = this.add.particles(0, 0, 'p_heart', {
    speedY: { min: -35, max: -65 },
    scale: { start: 0.9, end: 0.3 },
    alpha: { start: 1, end: 0 },
    lifespan: 1000,
    emitting: false
  });

  player = this.physics.add.sprite(500, 365, 'sprite_kaelen').setDisplaySize(44, 66);
  player.setCollideWorldBounds(true);

  this.statusText = this.add.text(20, 20, 'HP: ' + hp + '/' + maxHp + ' | MP: ' + mp + '/' + maxMp, {
    fontSize: '13px', color: '#86efac', fontFamily: 'monospace', fontStyle: 'bold',
    backgroundColor: '#090d16', padding: { x: 8, y: 4 }
  });

  this.zoneText = this.add.text(400, 440, '', {
    fontSize: '12px', color: '#86efac', fontFamily: 'monospace',
    backgroundColor: '#14532d', padding: { x: 8, y: 4 }
  }).setOrigin(0.5);

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update(time) {
  const speed = 160;
  let vx = 0, vy = 0;
  if (this.cursors.left.isDown) vx = -speed;
  else if (this.cursors.right.isDown) vx = speed;
  if (this.cursors.up.isDown) vy = -speed * 0.7;
  else if (this.cursors.down.isDown) vy = speed * 0.7;

  player.setVelocity(vx, vy);
  player.y = Phaser.Math.Clamp(player.y, 345, 400);

  const dist = Phaser.Math.Distance.Between(player.x, player.y, chef.x, chef.y);
  if (dist < 110) {
    this.zoneText.setText('✨ ZONA AMAN KEDAI: Meregenerasi HP & MP!');
    if (time - lastHeal > 1200) {
      lastHeal = time;
      if (hp < maxHp || mp < maxMp) {
        hp = Math.min(maxHp, hp + 15);
        mp = Math.min(maxMp, mp + 8);
        healEmitter.emitParticleAt(player.x, player.y - 15, 3);
        this.statusText.setText('HP: ' + hp + '/' + maxHp + ' | MP: ' + mp + '/' + maxMp);
      }
    }
  } else {
    this.zoneText.setText('');
  }
}
`
  },
  {
    id: 'module_4',
    title: '⚠️ Modul 4: Penyergapan Musuh (Ambush Alert)',
    panelNumber: 'Panel 4',
    subtitle: 'Mata Merah Menyala di Semak & Cutscene Peringatan',
    description: 'Pelajari cara mendesain pemicu ketegangan (Suspense Transition): bandit mengintip di semak, tanda seru (!) muncul, kamera bergetar, dan pergeseran warna latar.',
    learningPoints: [
      'Trigger Koordinat: if (player.x > threshold) triggerAmbush()',
      'Efek Kamera: scene.cameras.main.shake(duration, intensity)',
      'Overlay Suasana Bahaya (Suspense Color Palette Shift)'
    ],
    code: `// MODUL 4: PENYERGAPAN MUSUH & AMBUSH ALERT
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 480,
  backgroundColor: '#0a0d14',
  render: { pixelArt: true, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 800, height: 480 },
  physics: { default: 'arcade', arcade: { gravity: { y: 0 } } },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let player;
let bandits = [];
let triggered = false;

function preload() {
  this.load.image('bg_forest', '/assets/bg/forest_outskirts.jpg');
  this.load.image('sprite_kaelen', '/assets/sprites/kaelen.png');
  this.load.image('bandit_1', '/assets/sprites/bandit_archer.png');
  this.load.image('bandit_4', '/assets/sprites/bandit_leader.png');
}

function create() {
  this.add.image(400, 240, 'bg_forest').setDisplaySize(800, 480);

  // Bandit mengintip di semak-semak kanan
  const b1 = this.add.sprite(730, 335, 'bandit_1').setScale(0.16);
  const b2 = this.add.sprite(775, 325, 'bandit_4').setScale(0.18);
  bandits.push(b1, b2);

  player = this.physics.add.sprite(300, 365, 'sprite_kaelen').setDisplaySize(44, 66);
  player.setCollideWorldBounds(true);

  this.add.text(20, 20, 'MODUL 4: Bergeraklah ke arah kanan menuju semak-semak...', {
    fontSize: '12px', color: '#fde047', fontFamily: 'monospace',
    backgroundColor: '#090d16', padding: { x: 8, y: 4 }
  });

  this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  if (triggered) {
    player.setVelocity(0, 0);
    return;
  }

  const speed = 160;
  let vx = 0;
  if (this.cursors.left.isDown) vx = -speed;
  else if (this.cursors.right.isDown) vx = speed;

  player.setVelocityX(vx);

  if (player.x > 660) {
    triggered = true;
    player.setVelocity(0, 0);

    // 1. Tanda Seru (!) Bouncing
    const alert = this.add.text(player.x, player.y - 50, '❗', { fontSize: '24px' }).setOrigin(0.5);
    this.tweens.add({ targets: alert, y: player.y - 65, duration: 250, yoyo: true, repeat: 2 });

    // 2. Kamera Bergetar
    this.cameras.main.shake(400, 0.015);

    // 3. Bandit Melompat Keluar
    bandits.forEach((b, i) => {
      this.tweens.add({
        targets: b,
        x: 630 - i * 50,
        y: 365,
        scale: 0.28,
        duration: 500,
        ease: 'Back.easeOut'
      });
    });

    this.add.text(400, 430, '⚠️ AMBUSH ALERT! Bandit mengepung party!', {
      fontSize: '14px', color: '#ef4444', fontFamily: 'monospace', fontStyle: 'bold',
      backgroundColor: '#090d16', padding: { x: 12, y: 6 }
    }).setOrigin(0.5);
  }
}
`
  },
  {
    id: 'module_5',
    title: '⚔️ Modul 5: Sistem Pertarungan Turn-Based (Battle Mode)',
    panelNumber: 'Panel 5',
    subtitle: 'Formasi Tempur, Menu Perintah (Attack/Magic/Item/Run) & HP Bar',
    description: 'Pelajari implementasi sistem pertarungan turn-based klasik: antrian giliran pemain dan musuh, penghitungan damage, bar HP dinamis, dan efek tebasan.',
    learningPoints: [
      'State Machine Pertarungan (PLAYER_TURN -> ACTION -> ENEMY_TURN)',
      'Rumus Damage: damage = Math.floor(attacker.atk * randomFactor)',
      'Visual Feedback: Teks melayang angka damage & Flash kamera'
    ],
    code: `// MODUL 5: SISTEM PERTARUNGAN TURN-BASED (BATTLE ARENA)
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 480,
  backgroundColor: '#0a0d14',
  render: { pixelArt: true, roundPixels: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 800, height: 480 },
  scene: { preload, create }
};

const game = new Phaser.Game(config);

let hero, enemy;
let heroHp = 120, enemyHp = 100;
let heroHpBar, enemyHpBar, logText;
let isPlayerTurn = true;

function preload() {
  this.load.image('bg_battle', '/assets/bg/battle_arena.jpg');
  this.load.image('sprite_kaelen', '/assets/sprites/kaelen.png');
  this.load.image('bandit_leader', '/assets/sprites/bandit_leader.png');
}

function create() {
  this.add.image(400, 240, 'bg_battle').setDisplaySize(800, 480);

  // Kaelen di kiri
  hero = this.add.sprite(200, 260, 'sprite_kaelen').setScale(0.28);
  this.tweens.add({ targets: hero, y: 256, duration: 600, yoyo: true, repeat: -1 });

  // Bandit di kanan
  enemy = this.add.sprite(600, 260, 'bandit_leader').setScale(0.32).setFlipX(true);
  this.tweens.add({ targets: enemy, y: 255, duration: 700, yoyo: true, repeat: -1 });

  // HP Bar Hero
  this.add.text(120, 160, 'Kaelen (Hero)', { fontSize: '11px', color: '#f8fafc', fontFamily: 'monospace' });
  this.add.rectangle(170, 180, 100, 8, 0x450a0a);
  heroHpBar = this.add.rectangle(120, 180, 100, 8, 0x22c55e).setOrigin(0, 0.5);

  // HP Bar Enemy
  this.add.text(530, 160, 'Bandit Leader', { fontSize: '11px', color: '#f8fafc', fontFamily: 'monospace' });
  this.add.rectangle(580, 180, 100, 8, 0x450a0a);
  enemyHpBar = this.add.rectangle(530, 180, 100, 8, 0xef4444).setOrigin(0, 0.5);

  // Command Box
  this.add.rectangle(400, 420, 750, 80, 0x090d16, 0.95).setStrokeStyle(2, 0xe2e8f0);
  logText = this.add.text(45, 395, '⚔️ Giliranmu! Tekan [1] untuk Menyerang!', {
    fontSize: '12px', color: '#fde047', fontFamily: 'monospace', fontStyle: 'bold'
  });

  this.add.text(60, 425, '[1] ATTACK ⚔️', { fontSize: '13px', color: '#f8fafc', fontFamily: 'monospace', fontStyle: 'bold' });
  this.add.text(250, 425, '[2] MAGIC ✨', { fontSize: '13px', color: '#67e8f9', fontFamily: 'monospace', fontStyle: 'bold' });

  const scene = this;
  this.input.keyboard.on('keydown', (e) => {
    if (!isPlayerTurn) return;

    if (e.code === 'Digit1') {
      isPlayerTurn = false;
      const dmg = 30 + Math.floor(Math.random() * 15);

      scene.tweens.add({
        targets: hero,
        x: 520,
        duration: 150,
        yoyo: true,
        onYoyo: () => {
          enemyHp = Math.max(0, enemyHp - dmg);
          enemyHpBar.width = Math.max(0, enemyHp);
          scene.cameras.main.shake(100, 0.01);
          logText.setText('💥 Kaelen menebas Bandit sebesar ' + dmg + ' Damage!');
        },
        onComplete: () => {
          if (enemyHp <= 0) {
            logText.setText('🎉 VICTORY! Bandit Leader berhasil dikalahkan!');
            enemy.setTint(0x333333);
            return;
          }

          // Giliran Musuh
          scene.time.delayedCall(800, () => {
            const enemyDmg = 18 + Math.floor(Math.random() * 10);
            scene.tweens.add({
              targets: enemy,
              x: 280,
              duration: 150,
              yoyo: true,
              onYoyo: () => {
                heroHp = Math.max(0, heroHp - enemyDmg);
                heroHpBar.width = Math.max(0, heroHp);
                logText.setText('⚔️ Bandit menyerang balik sebesar ' + enemyDmg + ' Damage!');
              },
              onComplete: () => {
                isPlayerTurn = true;
                logText.setText('⚔️ Giliranmu! Tekan [1] untuk Menyerang!');
              }
            });
          });
        }
      });
    }
  });
}
`
  }
];
