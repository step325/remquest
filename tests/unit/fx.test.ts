import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMBO_WINDOW_MS,
  FX_BUFFER,
  FX_MAX_AGE_MS,
  comboTier,
  freshFxState,
  lastCombatSeq,
  normalizeFxState,
  pushFx,
  recentFx,
  unseenFx,
} from '../../src/lib/fx';

/** Scorciatoia: applica una sequenza di colpi a partire da uno stato pulito */
function hits(count: number, gapMs: number, start = 1_000) {
  let state = freshFxState();
  for (let i = 0; i < count; i++) {
    state = pushFx(state, { kind: 'hit', amount: 7 }, start + i * gapMs);
  }
  return state;
}

test('pushFx', async (t) => {
  await t.test('assegna numeri di sequenza crescenti', () => {
    const state = hits(3, 1_000);
    assert.deepEqual(
      state.events.map((e) => e.seq),
      [1, 2, 3]
    );
    assert.equal(state.seq, 3);
  });

  await t.test('registra istante, tipo e quantita\'', () => {
    const state = pushFx(freshFxState(), { kind: 'crit', amount: 22, damage: 14 }, 5_000);
    assert.equal(state.events[0].kind, 'crit');
    assert.equal(state.events[0].amount, 22);
    assert.equal(state.events[0].damage, 14);
    assert.equal(state.events[0].at, 5_000);
  });

  await t.test('XP e danno sono due numeri distinti', () => {
    // Un critico raddoppia il danno ma non gli XP: se ne portasse uno solo,
    // "CRITICO!" comparirebbe sopra un numero uguale a un colpo normale.
    const state = pushFx(freshFxState(), { kind: 'crit', amount: 10, damage: 14 }, 1_000);
    assert.notEqual(state.events[0].amount, state.events[0].damage);
  });

  await t.test('senza danno dichiarato vale zero', () => {
    const state = pushFx(freshFxState(), { kind: 'levelup', amount: 5 }, 1_000);
    assert.equal(state.events[0].damage, 0);
  });

  await t.test('il buffer tiene solo gli ultimi eventi', () => {
    const state = hits(FX_BUFFER + 5, 1_000);
    assert.equal(state.events.length, FX_BUFFER);
    // i piu' vecchi sono caduti, non i piu' recenti
    assert.equal(state.events[state.events.length - 1].seq, FX_BUFFER + 5);
    assert.equal(state.events[0].seq, 6);
  });

  await t.test('non muta lo stato ricevuto', () => {
    const before = freshFxState();
    pushFx(before, { kind: 'hit', amount: 5 }, 1_000);
    assert.equal(before.events.length, 0);
    assert.equal(before.seq, 0);
  });
});

test('combo', async (t) => {
  await t.test('cresce se i colpi restano dentro la finestra', () => {
    const state = hits(4, COMBO_WINDOW_MS - 1);
    assert.equal(state.combo, 4);
    assert.equal(state.events[3].combo, 4);
  });

  await t.test('riparte da 1 dopo una pausa piu\' lunga della finestra', () => {
    let state = hits(4, 1_000);
    state = pushFx(state, { kind: 'hit', amount: 7 }, state.comboAt + COMBO_WINDOW_MS + 1);
    assert.equal(state.combo, 1);
  });

  await t.test('il confine esatto della finestra tiene ancora la combo', () => {
    let state = hits(1, 0);
    state = pushFx(state, { kind: 'hit', amount: 7 }, state.comboAt + COMBO_WINDOW_MS);
    assert.equal(state.combo, 2);
  });

  await t.test('i crit contano come colpi', () => {
    let state = hits(2, 1_000);
    state = pushFx(state, { kind: 'crit', amount: 22 }, state.comboAt + 1_000);
    assert.equal(state.combo, 3);
  });

  await t.test('gli eventi non di combattimento non la toccano', () => {
    let state = hits(3, 1_000);
    const at = state.comboAt;
    state = pushFx(state, { kind: 'levelup', amount: 0, label: 'Esperto' }, at + 500);
    assert.equal(state.combo, 3);
    assert.equal(state.comboAt, at, 'un level up non deve prolungare la finestra');
  });

  await t.test('una card sbagliata la azzera', () => {
    let state = hits(6, 1_000);
    assert.equal(state.combo, 6);
    state = pushFx(state, { kind: 'miss' }, state.comboAt + 1_000);
    assert.equal(state.combo, 0, 'chi dimentica perde la serie');
  });

  await t.test('dopo una card sbagliata si riparte da uno', () => {
    let state = hits(6, 1_000);
    state = pushFx(state, { kind: 'miss' }, state.comboAt + 1_000);
    state = pushFx(state, { kind: 'hit', amount: 8, damage: 5 }, state.comboAt + 2_000);
    assert.equal(state.combo, 1);
  });

  await t.test('una card sbagliata non e\' un colpo al boss', () => {
    let state = hits(2, 1_000);
    state = pushFx(state, { kind: 'miss' }, state.comboAt + 1_000);
    assert.equal(lastCombatSeq(state), 2, 'il boss non deve sussultare per un errore');
  });

  await t.test('un evento non di combattimento non spezza la combo in corso', () => {
    let state = hits(3, 1_000);
    state = pushFx(state, { kind: 'mission', amount: 0 }, state.comboAt + 1_000);
    state = pushFx(state, { kind: 'hit', amount: 7 }, state.comboAt + 2_000);
    assert.equal(state.combo, 4);
  });
});

test('comboTier', async (t) => {
  await t.test('sotto la soglia non c\'e\' nessun livello di combo', () => {
    assert.equal(comboTier(0), 0);
    assert.equal(comboTier(1), 0);
    assert.equal(comboTier(4), 0);
  });

  await t.test('sale per scaglioni', () => {
    assert.equal(comboTier(5), 1);
    assert.equal(comboTier(9), 1);
    assert.equal(comboTier(10), 2);
    assert.equal(comboTier(19), 2);
    assert.equal(comboTier(20), 3);
    assert.equal(comboTier(999), 3);
  });
});

test('unseenFx', async (t) => {
  await t.test('restituisce solo gli eventi dopo l\'ultimo visto', () => {
    const state = hits(5, 1_000);
    assert.deepEqual(
      unseenFx(state, 3).map((e) => e.seq),
      [4, 5]
    );
  });

  await t.test('da zero li restituisce tutti quelli ancora nel buffer', () => {
    const state = hits(3, 1_000);
    assert.equal(unseenFx(state, 0).length, 3);
  });

  await t.test('niente da mostrare se il widget e\' gia\' aggiornato', () => {
    const state = hits(3, 1_000);
    assert.deepEqual(unseenFx(state, 3), []);
    assert.deepEqual(unseenFx(state, 99), []);
  });

  await t.test('un widget rimasto indietro oltre il buffer non rivede i vecchi', () => {
    const state = hits(FX_BUFFER + 10, 1_000);
    const seen = unseenFx(state, 2);
    assert.equal(seen.length, FX_BUFFER);
    assert.ok(
      seen.every((e) => e.seq > 2),
      'nessun evento gia\' visto deve tornare indietro'
    );
  });
});

test('lastCombatSeq', async (t) => {
  await t.test('senza colpi non c\'e\' niente da far sussultare', () => {
    assert.equal(lastCombatSeq(freshFxState()), 0);
    const solo = pushFx(freshFxState(), { kind: 'levelup', amount: 0 }, 1_000);
    assert.equal(lastCombatSeq(solo), 0);
  });

  await t.test('e\' l\'ultimo colpo, non l\'ultimo evento', () => {
    let state = hits(2, 1_000);
    state = pushFx(state, { kind: 'mission', amount: 0 }, 3_000);
    state = pushFx(state, { kind: 'levelup', amount: 0 }, 3_100);
    assert.equal(state.seq, 4);
    assert.equal(lastCombatSeq(state), 2);
  });

  await t.test('anche un critico e\' un colpo', () => {
    let state = hits(1, 0);
    state = pushFx(state, { kind: 'crit', amount: 22 }, 2_000);
    assert.equal(lastCombatSeq(state), 2);
  });
});

test('recentFx', async (t) => {
  await t.test('lascia passare solo gli eventi appena accaduti', () => {
    const state = hits(3, 1_000); // eventi a 1000, 2000, 3000
    assert.deepEqual(
      recentFx(state, 0, 6_500).map((e) => e.seq),
      [3],
      'i primi due hanno passato i quattro secondi'
    );
  });

  await t.test('l\'eta\' esatta del limite e\' gia\' troppo', () => {
    const state = hits(1, 0); // unico evento a 1000
    assert.deepEqual(recentFx(state, 0, 1_000 + FX_MAX_AGE_MS - 1).length, 1);
    assert.deepEqual(recentFx(state, 0, 1_000 + FX_MAX_AGE_MS), []);
  });

  await t.test('un widget appena aperto non recupera gli effetti di prima', () => {
    const state = hits(5, 1_000);
    const molto_dopo = 5_000 + FX_MAX_AGE_MS * 10;
    assert.deepEqual(recentFx(state, 0, molto_dopo), []);
  });

  await t.test('vale comunque il filtro sugli eventi gia\' visti', () => {
    const state = hits(3, 10);
    assert.deepEqual(
      recentFx(state, 2, 1_020).map((e) => e.seq),
      [3]
    );
  });
});

test('normalizeFxState', async (t) => {
  await t.test('uno storage vuoto diventa uno stato pulito', () => {
    assert.deepEqual(normalizeFxState(undefined), freshFxState());
    assert.deepEqual(normalizeFxState(null), freshFxState());
    assert.deepEqual(normalizeFxState('spazzatura'), freshFxState());
  });

  await t.test('scarta gli eventi malformati e tiene i buoni', () => {
    const state = normalizeFxState({
      seq: 4,
      combo: 2,
      comboAt: 100,
      events: [
        { seq: 3, kind: 'hit', amount: 7, combo: 1, at: 90 },
        { seq: 4, kind: 'inventato', amount: 7, combo: 2, at: 100 },
        null,
        { kind: 'hit', amount: 7 },
      ],
    });
    assert.equal(state.events.length, 1);
    assert.equal(state.events[0].seq, 3);
    assert.equal(state.seq, 4);
  });

  await t.test('agli eventi scritti prima del danno ne assegna zero', () => {
    const state = normalizeFxState({
      seq: 1,
      combo: 1,
      comboAt: 90,
      events: [{ seq: 1, kind: 'hit', amount: 7, combo: 1, at: 90 }],
    });
    assert.equal(state.events.length, 1);
    assert.equal(state.events[0].damage, 0);
  });

  await t.test('i numeri non validi tornano a zero', () => {
    const state = normalizeFxState({ seq: NaN, combo: -5, comboAt: 'ieri', events: 'boh' });
    assert.equal(state.seq, 0);
    assert.equal(state.combo, 0);
    assert.equal(state.comboAt, 0);
    assert.deepEqual(state.events, []);
  });
});
