/**
 * Il bestiario che si riempie — logica pura.
 *
 * Ventisei mostri di cui se ne vede uno al giorno e poi piu' nessuno: senza un
 * elenco che resta, il bestiario e' lavoro buttato. Qui si tiene traccia di chi
 * si e' incontrato e di chi si e' abbattuto, che sono due cose diverse — la
 * prima capita da sola, la seconda bisogna meritarsela.
 *
 * Lo stato e' sincronizzato fra dispositivi: e' una raccolta di una vita, non
 * roba di giornata.
 */

import { TOTAL_MONSTERS, type Monster } from './bestiary';

export interface Collection {
  /** Id dei mostri comparsi almeno una volta */
  seen: string[];
  /** Id dei mostri portati a zero punti vita */
  defeated: string[];
}

export const freshCollection = (): Collection => ({ seen: [], defeated: [] });

/**
 * Identificativo di un mostro.
 *
 * Lo scaglione fa parte del nome: senza, il primo comune e il primo boss
 * avrebbero lo stesso id e sbloccarne uno segnerebbe anche l'altro.
 */
export const monsterId = (monster: Monster): string => `${monster.tier}:${monster.index}`;

/** Aggiunge una voce solo se manca, restituendo lo stesso array quando c'e' gia' */
function including(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id];
}

/**
 * Segna un mostro come incontrato.
 * Se non c'e' niente di nuovo restituisce lo stato ricevuto, cosi' chi chiama
 * puo' evitare una scrittura inutile con un semplice confronto.
 */
export function withSeen(collection: Collection, monster: Monster): Collection {
  const seen = including(collection.seen, monsterId(monster));
  return seen === collection.seen ? collection : { ...collection, seen };
}

/** Segna un mostro come abbattuto; batterlo implica averlo incontrato */
export function withDefeated(collection: Collection, monster: Monster): Collection {
  const id = monsterId(monster);
  const defeated = including(collection.defeated, id);
  const seen = including(collection.seen, id);
  if (defeated === collection.defeated && seen === collection.seen) return collection;
  return { seen, defeated };
}

export interface CollectionProgress {
  seen: number;
  defeated: number;
  total: number;
}

export function collectionProgress(collection: Collection): CollectionProgress {
  return {
    seen: collection.seen.length,
    defeated: collection.defeated.length,
    total: TOTAL_MONSTERS,
  };
}

/** Solo le stringhe, e ognuna una volta sola */
function ids(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((v): v is string => typeof v === 'string'))];
}

export function normalizeCollection(value: unknown): Collection {
  if (!value || typeof value !== 'object') return freshCollection();
  const p = value as Record<string, unknown>;
  return { seen: ids(p.seen), defeated: ids(p.defeated) };
}
