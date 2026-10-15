import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GOAL, freshState, total, unlock, advance, loadState, helperCost, powerCost } from '../src/game.ts';

test('the gate requires a million times a billion times a trillion',()=>{assert.equal(GOAL,1_000_000n*1_000_000_000n*1_000_000_000_000n);});
test('only discovered world scores multiply; empty worlds do not zero the score',()=>{const s=freshState();s.worlds[0].score=12;s.worlds[1].score=10;assert.equal(total(s),12n);unlock(s);assert.equal(s.unlocked,3);assert.equal(total(s),120n);});
test('idle helpers increase both lifetime and spendable currency',()=>{const s=freshState();s.worlds[0].helpers=3;s.worlds[0].power=2;advance(s,10);assert.equal(s.worlds[0].score,121);assert.equal(s.worlds[0].bank,120);assert.ok(s.unlocked>1);});
test('offline production is capped at eight hours',()=>{const s=freshState();s.worlds[0].helpers=1;advance(s,999999);assert.equal(s.worlds[0].score,57601);});
test('saves preserve timestamps for offline progress and reject corrupt input',()=>{const s=freshState();s.saved=Date.now()-3600000;s.worlds[0].helpers=2;const restored=loadState(JSON.stringify(s));assert.equal(restored.saved,s.saved);advance(restored,3600);assert.equal(restored.worlds[0].score,14401);assert.equal(loadState('{oops').worlds[0].score,1);assert.equal(loadState(JSON.stringify({worlds:[]})).unlocked,1);});
test('all seven gems unlock in order, with a separate secret multiplier',()=>{const s=freshState();s.worlds[0].score=1e12;const names=unlock(s);assert.equal(names.length,6);assert.equal(s.unlocked,7);s.worlds[7].score=100;assert.equal(total(s),1_000_000_000_000n);s.secret=true;assert.equal(total(s),100_000_000_000_000n);});
test('upgrade prices grow independently of lifetime score',()=>{const s=freshState(),w=s.worlds[0];const h=helperCost(w),p=powerCost(w);w.helpers++;w.power++;assert.ok(helperCost(w)>h);assert.ok(powerCost(w)>p);assert.equal(w.score,1);});
test('invalid numbers and unearned endings cannot corrupt a restored game',()=>{const s=freshState();s.worlds[0].score=-1;s.unlocked=99;s.won=true;const restored=loadState(JSON.stringify(s));assert.equal(restored.worlds[0].score,1);assert.equal(restored.unlocked,7);assert.equal(restored.won,false);});
