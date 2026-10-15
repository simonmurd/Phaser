/**
 * Core JRPG Game Rules & Logic (Pure TypeScript, decoupled from DOM/Phaser)
 * For unit testing and predictable simulation calculations.
 */

export interface CharacterStats {
  id: string;
  name: string;
  role: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface EnemyStats {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  expReward: number;
  goldReward: number;
}

export interface PositionPoint {
  x: number;
  y: number;
  facing: 'left' | 'right';
  isMoving: boolean;
}

/**
 * 1. Logika Antrian Jejak (Trail History) untuk Anggota Party
 * Menghitung posisi follower berdasarkan riwayat pergerakan leader.
 */
export function calculateFollowerPositions(
  history: PositionPoint[],
  followerSpacing: number = 20,
  partyCount: number = 4
): PositionPoint[] {
  const result: PositionPoint[] = [];
  
  for (let i = 1; i < partyCount; i++) {
    const targetIndex = i * followerSpacing;
    if (history.length > targetIndex) {
      result.push({ ...history[targetIndex] });
    } else if (history.length > 0) {
      // Fallback ke posisi paling akhir jika riwayat belum cukup panjang
      result.push({ ...history[history.length - 1] });
    } else {
      result.push({ x: 0, y: 0, facing: 'right', isMoving: false });
    }
  }

  return result;
}

/**
 * 2. Formula Kalkulasi Damage Fisik & Magic Turn-Based JRPG
 * formula: Math.max(1, (atk * multiplier * variance) - (def * 0.5))
 */
export function calculateDamage(
  attackerAtk: number,
  defenderDef: number,
  multiplier: number = 1.0,
  randomSeed: number = 0.5,
  isCritical: boolean = false
): { damage: number; isCrit: boolean } {
  // Variasi damage 85% sampai 115%
  const variance = 0.85 + (randomSeed * 0.3);
  const baseDamage = attackerAtk * multiplier * variance;
  const mitigation = defenderDef * 0.5;
  let finalDamage = Math.max(1, Math.round(baseDamage - mitigation));

  if (isCritical) {
    finalDamage = Math.round(finalDamage * 1.5);
  }

  return { damage: finalDamage, isCrit: isCritical };
}

/**
 * 3. Logika Restorasi HP & MP (Kedai Makanan / Safe Zone)
 */
export function restoreHealthAndMana(
  currentHp: number,
  maxHp: number,
  currentMp: number,
  maxMp: number,
  healPercent: number = 1.0
): { newHp: number; newMp: number; hpRestored: number; mpRestored: number } {
  const hpGain = Math.round(maxHp * healPercent);
  const mpGain = Math.round(maxMp * healPercent);

  const newHp = Math.min(maxHp, currentHp + hpGain);
  const newMp = Math.min(maxMp, currentMp + mpGain);

  return {
    newHp,
    newMp,
    hpRestored: newHp - currentHp,
    mpRestored: newMp - currentMp
  };
}

/**
 * 4. Logika Toko Senjata (Beli / Upgrade Senjata)
 */
export interface ShopItem {
  id: string;
  name: string;
  atkBonus: number;
  cost: number;
  category: 'sword' | 'axe' | 'bow' | 'potion';
}

export function purchaseItem(
  currentGold: number,
  characterAtk: number,
  item: ShopItem
): { success: boolean; newGold: number; newAtk: number; message: string } {
  if (currentGold < item.cost) {
    return {
      success: false,
      newGold: currentGold,
      newAtk: characterAtk,
      message: 'Koin emas tidak mencukupi!'
    };
  }

  return {
    success: true,
    newGold: currentGold - item.cost,
    newAtk: characterAtk + item.atkBonus,
    message: `Berhasil membeli ${item.name}! ATK bertambah +${item.atkBonus}.`
  };
}

/**
 * 5. State Machine Giliran Pertarungan (Turn-Based Battle Queue)
 */
export type BattleTurn = 'party' | 'enemy' | 'victory' | 'defeat';

export function determineNextBattleTurn(
  partyAlive: boolean,
  enemiesAlive: boolean,
  currentTurn: BattleTurn
): BattleTurn {
  if (!enemiesAlive) return 'victory';
  if (!partyAlive) return 'defeat';

  return currentTurn === 'party' ? 'enemy' : 'party';
}
