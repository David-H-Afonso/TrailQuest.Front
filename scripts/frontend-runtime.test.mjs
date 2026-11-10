import assert from 'node:assert/strict';
import test from 'node:test';
import { isCompatible } from './frontend-runtime.mjs';

const current = { platform: 'linux', architecture: 'x64', nodeMajor: 24, lockHash: 'fixture-lock-hash' };

test('the same runtime and lockfile can reuse dependencies', () => {
  assert.equal(isCompatible({ ...current }, current), true);
});

test('Windows dependencies are never considered reusable on CachyOS', () => {
  assert.equal(isCompatible({ ...current, platform: 'win32' }, current), false);
});

test('architecture, Node major and lockfile changes require installation', () => {
  for (const change of [{ architecture: 'arm64' }, { nodeMajor: 22 }, { lockHash: 'different-lock' }])
    assert.equal(isCompatible({ ...current, ...change }, current), false);
  assert.equal(isCompatible(null, current), false);
});
