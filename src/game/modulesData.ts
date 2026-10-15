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
  this.load.image('bg_forest', 'assets/bg/forest_outskirts.jpg');
  this.load.image('bg_battle', 'assets/bg/battle_arena.jpg');

  // Party Sprites
  this.load.image('sprite_kaelen', 'assets/sprites/kaelen.png');
  this.load.image('sprite_lyra',   'assets/sprites/lyra.png');
  this.load.image('sprite_brutus', 'assets/sprites/brutus.png');
  this.load.image('sprite_elara',  'assets/sprites/elara.png');

  // NPC Sprites
  this.load.image('npc_smith', 'assets/sprites/npc_blacksmith.png');
  this.load.image('npc_chef',  'assets/sprites/npc_chef.png');

  // Bandit Enemy Sprites
  this.load.image('bandit_1', 'assets/sprites/bandit_archer.png');
  this.load.image('bandit_2', 'assets/sprites/bandit_dual.png');
  this.load.image('bandit_3', 'assets/sprites/bandit_shadow.png');
  this.load.image('bandit_4', 'assets/sprites/bandit_leader.png');

  // Character Face Portraits (Berbingkai Emas Retro)
  this.load.image('portrait_kaelen', 'assets/portraits/kaelen.png');
  this.load.image('portrait_lyra',   'assets/portraits/lyra.png');
  this.load.image('portrait_brutus', 'assets/portraits/brutus.png');
  this.load.image('portrait_elara',  'assets/portraits/elara.png');

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

  for (let i = 0; i < HISTORY_DELAY * 4; i++) {
    moveHistory.push({ x: 140, y: 365, flipX: false });
  }

  // 7. Buat Top HUD Berbingkai Emas & Radar Minimap
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

  if (Phaser.Input.Keyboard.JustDown(keyAction)) {
    if (gameState === 'DIALOG' || gameState === 'SHOP') {
      closeDialogue();
    } else if (gameState === 'EXPLORING') {
      checkInteractionTrigger(this);
    }
  }

  if (gameState === 'SHOP') {
    if (Phaser.Input.Keyboard.JustDown(key1)) buyWeapon(1, this);
    if (Phaser.Input.Keyboard.JustDown(key2)) buyWeapon(2, this);
    if (Phaser.Input.Keyboard.JustDown(key3)) buyWeapon(3, this);
  }

  if (gameState !== 'EXPLORING') {
    leaderSprite.setVelocity(0, 0);
    return;
  }

  const speed = 165;
  let vx = 0, vy = 0;

  if (cursors.left.isDown || wasd.left.isDown) vx = -speed;
  else if (cursors.right.isDown || wasd.right.isDown) vx = speed;

  if (cursors.up.isDown || wasd.up.isDown) vy = -speed * 0.7;
  else if (cursors.down.isDown || wasd.down.isDown) vy = speed * 0.7;

  leaderSprite.setVelocity(vx, vy);

  leaderSprite.y = Phaser.Math.Clamp(leaderSprite.y, 345, 400);
  leaderShadow.x = leaderSprite.x;
  leaderShadow.y = leaderSprite.y + 31;

  const isMoving = vx !== 0 || vy !== 0;

  if (isMoving) {
    walkStep += delta * 0.015;
    const bob = Math.sin(walkStep * 6) * 2.5;
    leaderSprite.y += bob;

    if (Math.sin(walkStep * 6) > 0.9) Sfx.playStep();

    if (Math.random() < 0.25) {
      this.dustEmitter.emitParticleAt(leaderSprite.x, leaderSprite.y + 30);
    }

    if (vx < 0) leaderSprite.setFlipX(true);
    else if (vx > 0) leaderSprite.setFlipX(false);

    moveHistory.unshift({ x: leaderSprite.x, y: leaderSprite.y - bob, flipX: leaderSprite.flipX });
    if (moveHistory.length > HISTORY_DELAY * 4) moveHistory.pop();
  }

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

  checkFoodSafeZone(this, time);
  checkAmbushTrigger(this);
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
// FITUR PANEL 3: SAFE ZONE KEDAI MAKANAN
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
// FITUR PANEL 4: AMBUSH ALERT CUTSCENE
// ----------------------------------------------------------------------------
function checkAmbushTrigger(scene) {
  if (ambushTriggered) return;

  if (leaderSprite.x > 660) {
    ambushTriggered = true;
    gameState = 'AMBUSH_CUTSCENE';
    leaderSprite.setVelocity(0, 0);

    Sfx.playAlert();

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

    scene.cameras.main.shake(400, 0.012);
    const dangerOverlay = scene.add.rectangle(400, 240, 800, 480, 0x1e1b4b, 0.45).setDepth(150);

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
  scene.cameras.main.flash(450, 255, 255, 255);

  battleContainer = scene.add.container(0, 0).setDepth(500);

  bgBattle = scene.add.image(400, 240, 'bg_battle').setDisplaySize(800, 480);
  battleContainer.add(bgBattle);

  battlePartySprites = [];
  const partyPositions = [
    { x: 180, y: 220, key: 'sprite_kaelen', scale: 0.28 },
    { x: 130, y: 170, key: 'sprite_lyra',   scale: 0.27 },
    { x: 110, y: 290, key: 'sprite_brutus', scale: 0.29 },
    { x: 70,  y: 225, key: 'sprite_elara',  scale: 0.27 }
  ];

  partyPositions.forEach((pos, i) => {
    const sh = scene.add.ellipse(pos.x, pos.y + 40, 36, 12, 0x000000, 0.45);
    const heroSprite = scene.add.sprite(pos.x, pos.y, pos.key).setScale(pos.scale);
    scene.tweens.add({ targets: heroSprite, y: pos.y - 4, duration: 600 + i * 80, yoyo: true, repeat: -1 });

    battleContainer.add([sh, heroSprite]);
    battlePartySprites.push(heroSprite);
  });

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

    const hpBarBg = scene.add.rectangle(pos.x, pos.y - 45, 48, 6, 0x450a0a);
    const hpBarFill = scene.add.rectangle(pos.x - 24, pos.y - 45, 48, 6, 0xef4444).setOrigin(0, 0.5);
    const nameLabel = scene.add.text(pos.x, pos.y - 56, enemy.name, {
      fontSize: '8px', color: '#f8fafc', fontFamily: 'monospace'
    }).setOrigin(0.5);

    battleContainer.add([sh, sprite, hpBarBg, hpBarFill, nameLabel]);
    battleEnemySprites.push({ sprite, hpBarFill, enemy, hpBarBg, nameLabel });
  });

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
  battleLogText.setText('🧪 Menggunakan Elixir Potion! Seluruh party pulih +45 HP.');

  scene.time.delayedCall(600, () => {
    checkBattleStateOrEnemyTurn(scene);
  });
}

function executePlayerRun(scene) {
  isPlayerTurn = false;
  Sfx.playSlash();
  battleLogText.setText('🏃 Berhasil melarikan diri dari penyergapan bandit!');
  
  scene.time.delayedCall(800, () => {
    battleContainer.destroy();
    gameState = 'EXPLORING';
    isPlayerTurn = true;
    leaderSprite.x -= 80;
  });
}

function checkBattleStateOrEnemyTurn(scene) {
  const allEnemiesDefeated = enemies.every(e => e.hp <= 0);
  if (allEnemiesDefeated) {
    return handleVictory(scene);
  }

  battleLogText.setText('⚠️ Bandit bersiap melancarkan serangan balasan!');
  scene.time.delayedCall(700, () => {
    const activeEnemies = enemies.filter(e => e.hp > 0);
    const attacker = activeEnemies[Math.floor(Math.random() * activeEnemies.length)];
    const targetHero = party[Math.floor(Math.random() * party.length)];
    const dmg = Math.max(5, attacker.atk - Math.floor(targetHero.def * 0.4));
    
    targetHero.hp = Math.max(0, targetHero.hp - dmg);
    updatePartyHUDVisuals();
    Sfx.playSlash();

    battleLogText.setText('⚔️ ' + attacker.name + ' menyerang ' + targetHero.name + ' (' + dmg + ' DMG)!');
    scene.cameras.main.shake(100, 0.006);

    const allHeroesDead = party.every(h => h.hp <= 0);
    if (allHeroesDead) {
      battleLogText.setText('💀 Seluruh Party K.O... Game Over!');
      scene.time.delayedCall(1500, () => {
        battleContainer.destroy();
        gameState = 'EXPLORING';
        party.forEach(h => { h.hp = h.maxHp; });
        leaderSprite.x = 140;
        ambushTriggered = false;
        updatePartyHUDVisuals();
      });
      isPlayerTurn = true;
      return;
    }

    scene.time.delayedCall(900, () => {
      battleLogText.setText('⚔️ Giliran Party Anda! Pilih Perintah (1-4):');
      isPlayerTurn = true;
    });
  });
}

function handleVictory(scene) {
  Sfx.playVictory();
  gold += 120;
  battleLogText.setText('🎉 KEMENANGAN! Party mengalahkan bandit! (+120 Gold, Total: ' + gold + ' G)');

  scene.time.delayedCall(1600, () => {
    battleContainer.destroy();
    gameState = 'EXPLORING';
    isPlayerTurn = true;
    ambushTriggered = true;
    leaderSprite.x = 730;
    updatePartyHUDVisuals();
  });
}

// ----------------------------------------------------------------------------
// UI & HUD HELPER FUNCTIONS
// ----------------------------------------------------------------------------
function createPartyHUD(scene) {
  const hudBg = scene.add.rectangle(400, 30, 780, 48, 0x090d16, 0.9).setDepth(300);
  hudBg.setStrokeStyle(2, 0xd4af37);

  window.partyHUDCards = [];

  party.forEach((hero, i) => {
    const x = 95 + i * 175;
    
    const portraitBg = scene.add.rectangle(x - 55, 30, 36, 36, 0x1e293b).setDepth(301);
    portraitBg.setStrokeStyle(1.5, 0xd4af37);
    const portrait = scene.add.sprite(x - 55, 30, 'portrait_' + hero.id).setDisplaySize(32, 32).setDepth(302);

    const nameText = scene.add.text(x - 33, 13, hero.name, {
      fontSize: '11px', color: '#fde047', fontFamily: 'monospace', fontStyle: 'bold'
    }).setDepth(301);

    const lvlText = scene.add.text(x + 52, 13, 'Lv.' + hero.level, {
      fontSize: '9px', color: '#cbd5e1', fontFamily: 'monospace'
    }).setOrigin(1, 0).setDepth(301);

    const hpBg = scene.add.rectangle(x - 33, 27, 85, 5, 0x450a0a).setOrigin(0, 0.5).setDepth(301);
    const hpFill = scene.add.rectangle(x - 33, 27, 85, 5, 0xef4444).setOrigin(0, 0.5).setDepth(302);

    const mpBg = scene.add.rectangle(x - 33, 37, 85, 4, 0x082f49).setOrigin(0, 0.5).setDepth(301);
    const mpFill = scene.add.rectangle(x - 33, 37, 85, 4, 0x06b6d4).setOrigin(0, 0.5).setDepth(302);

    window.partyHUDCards.push({ hero, hpFill, mpFill });
  });

  const mmBg = scene.add.rectangle(755, 30, 64, 36, 0x020617, 0.85).setDepth(300);
  mmBg.setStrokeStyle(1, 0x64748b);
  window.minimapPlayerDot = scene.add.circle(730, 30, 3.5, 0x38bdf8).setDepth(301);
  scene.add.text(755, 14, 'MAP: FOREST', { fontSize: '7px', color: '#94a3b8', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(301);
}

function updatePartyHUDVisuals() {
  if (!window.partyHUDCards) return;
  window.partyHUDCards.forEach(card => {
    card.hpFill.width = 85 * (card.hero.hp / card.hero.maxHp);
    card.mpFill.width = 85 * (card.hero.mp / card.hero.maxMp);
  });
}

function updateMinimapRadar() {
  if (!window.minimapPlayerDot) return;
  const mappedX = 723 + (leaderSprite.x / 800) * 64;
  window.minimapPlayerDot.x = Phaser.Math.Clamp(mappedX, 723, 787);
}

function createDialogueUI(scene) {
  dialogueBox = scene.add.rectangle(400, 410, 750, 90, 0x090d16, 0.94).setDepth(400).setVisible(false);
  dialogueBox.setStrokeStyle(2, 0xd4af37);

  dialogueText = scene.add.text(50, 375, '', {
    fontSize: '11px', color: '#f8fafc', fontFamily: 'monospace', lineSpacing: 4
  }).setDepth(401);

  interactPrompt = scene.add.text(400, 445, '', {
    fontSize: '11px', color: '#fde047', fontFamily: 'monospace', backgroundColor: '#0f172a', padding: { x: 8, y: 3 }
  }).setOrigin(0.5).setDepth(400).setVisible(false);
}

function openDialogue(title, text) {
  dialogueText.setText('【 ' + title + ' 】\\n' + text);
  dialogueBox.setVisible(true);
  dialogueText.setVisible(true);
}

function updateDialogueText(title, text) {
  dialogueText.setText('【 ' + title + ' 】\\n' + text);
}

function closeDialogue() {
  gameState = 'EXPLORING';
  dialogueBox.setVisible(false);
  dialogueText.setVisible(false);
}

function showFloatingText(scene, x, y, msg, colorHex) {
  const txt = scene.add.text(x, y, msg, {
    fontSize: '12px', color: colorHex, fontFamily: 'monospace', fontStyle: 'bold'
  }).setOrigin(0.5).setDepth(250);

  scene.tweens.add({
    targets: txt,
    y: y - 35,
    alpha: 0,
    duration: 900,
    onComplete: () => txt.destroy()
  });
}
`
  }
];
