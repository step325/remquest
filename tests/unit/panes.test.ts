import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isWidgetPane,
  flattenPanes,
  pruneTree,
  treeWithoutWidgetPanes,
  type PaneTree,
} from '../../src/lib/panes';

const doc = (n: string) => ({ remId: `doc-${n}`, paneId: `pane-${n}` });
const widget = (n: string) => ({ remId: `(widget~${n})`, paneId: `pane-${n}` });

const split = (first: PaneTree, second: PaneTree, splitPercentage = 50): PaneTree => ({
  direction: 'row',
  first,
  second,
  splitPercentage,
});

test('isWidgetPane', async (t) => {
  await t.test('riconosce il remId sintetico dei pane widget', () => {
    assert.equal(isWidgetPane('(widget~NkbegWiGwHCPj6jJa)'), true);
    assert.equal(isWidgetPane('doc-123'), false);
  });

  await t.test('valori non stringa non sono pane widget', () => {
    assert.equal(isWidgetPane(undefined), false);
    assert.equal(isWidgetPane(null), false);
    assert.equal(isWidgetPane(42), false);
  });
});

test('flattenPanes', async (t) => {
  await t.test('un solo pane', () => {
    assert.deepEqual(flattenPanes(doc('a')), [doc('a')]);
  });

  await t.test('albero annidato, ordine da sinistra a destra', () => {
    const tree = split(split(doc('a'), widget('b')), doc('c'));
    assert.deepEqual(
      flattenPanes(tree).map((p) => p.paneId),
      ['pane-a', 'pane-b', 'pane-c']
    );
  });
});

test('pruneTree', async (t) => {
  await t.test('tenere tutto restituisce la stessa forma in remId', () => {
    const tree = split(doc('a'), doc('b'), 30);
    assert.deepEqual(pruneTree(tree, () => true), {
      direction: 'row',
      first: 'doc-a',
      second: 'doc-b',
      splitPercentage: 30,
    });
  });

  await t.test('rimuovendo un ramo il fratello prende il suo posto', () => {
    const tree = split(doc('a'), widget('b'));
    assert.equal(pruneTree(tree, (p) => !isWidgetPane(p.remId)), 'doc-a');
  });

  await t.test('scartare tutto restituisce null', () => {
    assert.equal(pruneTree(split(widget('a'), widget('b')), () => false), null);
  });
});

test('treeWithoutWidgetPanes', async (t) => {
  await t.test('nessun pane widget: niente da riscrivere', () => {
    assert.equal(treeWithoutWidgetPanes(split(doc('a'), doc('b'))), null);
    assert.equal(treeWithoutWidgetPanes(doc('a')), null);
  });

  await t.test('toglie i pane widget accumulati', () => {
    // La forma dell'errore reale: un documento e piu' widget annidati
    let tree: PaneTree = doc('notes');
    for (const n of ['w1', 'w2', 'w3']) tree = split(tree, widget(n));

    assert.equal(treeWithoutWidgetPanes(tree), 'doc-notes');
  });

  await t.test('conserva i pane normali attorno a quelli widget', () => {
    const tree = split(split(doc('a'), widget('w')), doc('b'), 40);
    assert.deepEqual(treeWithoutWidgetPanes(tree), {
      direction: 'row',
      first: 'doc-a',
      second: 'doc-b',
      splitPercentage: 40,
    });
  });

  await t.test("finestra di soli pane widget: null, non si puo' restare senza pane", () => {
    assert.equal(treeWithoutWidgetPanes(split(widget('a'), widget('b'))), null);
    assert.equal(treeWithoutWidgetPanes(widget('a')), null);
  });
});
