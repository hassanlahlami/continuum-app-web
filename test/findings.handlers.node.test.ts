import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { setupServer } from 'msw/node';
import type { Finding } from '../libs/api-clients/findings';
import { handlers } from '../libs/mocks';

/**
 * Vérifie les handlers MSW des constats (D32) sans navigateur : le détail porte l'action `validate`
 * décidée par le serveur (§2.1.4), et l'action renvoie le constat validé. `node --test` sur les mocks
 * compilés — garantit que le mode mock sert le parcours de validation.
 */
const server = setupServer(...handlers);
const MISSION = 'a0000000-0000-0000-0000-0000000000a1';
const FINDING = 'c1a2b3d4-0000-0000-0000-000000000001';

before(() => server.listen({ onUnhandledRequest: 'error' }));
after(() => server.close());

test('GET detail expose l\'action validate (primary) sur un constat ouvert', async () => {
  const res = await fetch(`http://app.local/api/app/missions/${MISSION}/findings/${FINDING}`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as Finding;
  assert.equal(body.status.code, 'OUVERT');
  assert.equal(body.availableActions?.length, 1);
  assert.equal(body.availableActions?.[0].code, 'validate');
  assert.equal(body.availableActions?.[0].style, 'primary');
  assert.equal(body.meta.version, 1);
});

test('POST action validate renvoie le constat validé, sans action restante', async () => {
  const res = await fetch(
    `http://app.local/api/app/missions/${MISSION}/findings/${FINDING}/actions/validate`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ version: 1 }) },
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as Finding;
  assert.equal(body.status.code, 'VALIDATED');
  assert.equal(body.availableActions?.length, 0);
  assert.equal(body.meta.version, 2);
});

test('POST action inconnue est rejetée (422)', async () => {
  const res = await fetch(
    `http://app.local/api/app/missions/${MISSION}/findings/${FINDING}/actions/frobnicate`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ version: 1 }) },
  );
  assert.equal(res.status, 422);
});
