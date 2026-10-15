import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFollowerPositions,
  calculateDamage,
  restoreHealthAndMana,
  purchaseItem,
  determineNextBattleTurn,
  type PositionPoint,
  type ShopItem
} from './rules.ts';

test('Follower trail positions are sampled accurately along history queue', () => {
  const history: PositionPoint[] = [];
  for (let i = 0; i < 100; i++) {
    history.push({ x: i * 5, y: 150, facing: 'right', isMoving: true });
  }

  const followers = calculateFollowerPositions(history, 20, 4);
  assert.equal(followers.length, 3, 'Should return 3 followers for a 4-person party');
  assert.equal(followers[0].x, 20 * 5, 'Follower 1 should be at spacing 20');
  assert.equal(followers[1].x, 40 * 5, 'Follower 2 should be at spacing 40');
  assert.equal(followers[2].x, 60 * 5, 'Follower 3 should be at spacing 60');
});

test('Combat damage calculates base mitigation and critical bonus', () => {
  const normalHit = calculateDamage(30, 10, 1.0, 0.5, false);
  // base = 30 * 1.0 * (0.85 + 0.15) = 30; mit = 10 * 0.5 = 5; result = 25
  assert.equal(normalHit.damage, 25);
  assert.equal(normalHit.isCrit, false);

  const critHit = calculateDamage(30, 10, 1.0, 0.5, true);
  assert.equal(critHit.damage, Math.round(25 * 1.5));
  assert.equal(critHit.isCrit, true);

  // Even against high defense, minimum damage is 1
  const heavyDefense = calculateDamage(5, 50, 1.0, 0.5, false);
  assert.equal(heavyDefense.damage, 1);
});

test('Safe Zone rest replenishes HP and MP up to max ceiling', () => {
  const healResult = restoreHealthAndMana(20, 100, 15, 60, 1.0);
  assert.equal(healResult.newHp, 100);
  assert.equal(healResult.newMp, 60);
  assert.equal(healResult.hpRestored, 80);
  assert.equal(healResult.mpRestored, 45);
});

test('Weapons shop transaction updates gold and character attack', () => {
  const item: ShopItem = {
    id: 'steel_sword',
    name: 'Pedang Baja Tempa',
    atkBonus: 12,
    cost: 50,
    category: 'sword'
  };

  const successBuy = purchaseItem(100, 24, item);
  assert.equal(successBuy.success, true);
  assert.equal(successBuy.newGold, 50);
  assert.equal(successBuy.newAtk, 36);

  const failBuy = purchaseItem(30, 24, item);
  assert.equal(failBuy.success, false);
  assert.equal(failBuy.newGold, 30);
  assert.equal(failBuy.newAtk, 24);
});

test('Battle state machine transitions turns and detects victory/defeat', () => {
  assert.equal(determineNextBattleTurn(true, true, 'party'), 'enemy');
  assert.equal(determineNextBattleTurn(true, true, 'enemy'), 'party');
  assert.equal(determineNextBattleTurn(true, false, 'party'), 'victory');
  assert.equal(determineNextBattleTurn(false, true, 'enemy'), 'defeat');
});
