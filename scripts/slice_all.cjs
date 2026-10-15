const { execSync } = require('child_process');
const fs = require('fs');

console.log('--- Memulai Ekstraksi Aset Pixel Art JRPG ---');

// 1. Salin Backgrounds
execSync('cp src/assets/images/jrpg_forest_outskirts_clean_1792034264683.jpg public/assets/bg/forest_outskirts.jpg');
execSync('cp src/assets/images/jrpg_battle_arena_1792033362042.jpg public/assets/bg/battle_arena.jpg');
console.log('✓ Backgrounds siap');

// 2. Ekstrak Potret Karakter (dengan bingkai emas retro asli)
const portraits = [
  { name: 'kaelen', crop: '305x570+32+95' },
  { name: 'lyra',   crop: '305x570+362+95' },
  { name: 'brutus', crop: '305x570+692+95' },
  { name: 'elara',  crop: '305x570+1022+95' }
];

portraits.forEach(p => {
  const cmd = `convert src/assets/images/jrpg_party_portraits_1792033360323.jpg -crop ${p.crop} +repage -resize 96x180\\! public/assets/portraits/${p.name}.png`;
  execSync(cmd);
  console.log(`✓ Portrait: ${p.name}`);
});

// 3. Ekstrak Sprite Party (Transparansi Floodfill dari luar)
const partySprites = [
  { name: 'kaelen', crop: '340x600+40+120' },
  { name: 'lyra',   crop: '330x600+370+150' },
  { name: 'brutus', crop: '370x560+690+180' },
  { name: 'elara',  crop: '340x590+1030+160' }
];

partySprites.forEach(s => {
  const cmd = `convert src/assets/images/jrpg_party_sprites_1792033361101.jpg -crop ${s.crop} +repage -bordercolor black -border 1 -fuzz 3% -fill none -floodfill +0+0 black -shave 1x1 -trim +repage public/assets/sprites/${s.name}.png`;
  execSync(cmd);
  console.log(`✓ Party Sprite: ${s.name}`);
});

// 4. Ekstrak Sprite Bandit
const banditSprites = [
  { name: 'bandit_archer', crop: '330x550+30+200' },
  { name: 'bandit_dual',   crop: '340x550+360+200' },
  { name: 'bandit_shadow', crop: '300x550+710+200' },
  { name: 'bandit_leader', crop: '350x570+1010+180' }
];

banditSprites.forEach(b => {
  const cmd = `convert src/assets/images/jrpg_bandit_enemies_1792033363859.jpg -crop ${b.crop} +repage -bordercolor black -border 1 -fuzz 3% -fill none -floodfill +0+0 black -shave 1x1 -trim +repage public/assets/sprites/${b.name}.png`;
  execSync(cmd);
  console.log(`✓ Bandit Sprite: ${b.name}`);
});

// 5. Ekstrak Sprite NPC (White background floodfill)
const npcSprites = [
  { name: 'npc_blacksmith', crop: '580x720+80+20' },
  { name: 'npc_chef',       crop: '580x680+750+60' }
];

npcSprites.forEach(n => {
  const cmd = `convert src/assets/images/jrpg_npc_merchants_1792034316870.jpg -crop ${n.crop} +repage -bordercolor white -border 1 -fuzz 18% -fill none -floodfill +0+0 white -shave 1x1 -trim +repage public/assets/sprites/${n.name}.png`;
  execSync(cmd);
  console.log(`✓ NPC Sprite: ${n.name}`);
});

console.log('--- Semua Aset Pixel Art Berhasil Diproses! ---');
