import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../data/exercises';
import {
  filterExercises,
  fold,
  getChapterTitle,
  getSubject,
  getValidationLabel,
  matchesSearch,
} from './exercise-utils';

describe('catalogue', () => {
  it('holds the 14 exercises with unique JNG-PC-xx IDs', () => {
    expect(EXERCISES).toHaveLength(14);
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(14);
    for (const exercise of EXERCISES) expect(exercise.id).toMatch(/^JNG-PC-\d{2}$/);
  });

  it('exposes only public fields', () => {
    for (const exercise of EXERCISES) {
      expect(Object.keys(exercise).sort()).toEqual(['chapter', 'data', 'id', 'statement', 'validation']);
    }
  });
});

describe('subject and chapter', () => {
  it('derives the subject from the chapter prefix', () => {
    expect(getSubject('Chimie — Acides forts')).toBe('Chimie');
    expect(getSubject('Physique — Dipôle RC')).toBe('Physique');
  });

  it('splits Chimie 01-06 and Physique 07-14', () => {
    expect(EXERCISES.filter((e) => getSubject(e.chapter) === 'Chimie')).toHaveLength(6);
    expect(EXERCISES.filter((e) => getSubject(e.chapter) === 'Physique')).toHaveLength(8);
  });

  it('removes the subject prefix from the title', () => {
    expect(getChapterTitle('Chimie — Acides forts')).toBe('Acides forts');
    expect(getChapterTitle('Sans séparateur')).toBe('Sans séparateur');
  });
});

describe('search', () => {
  it('ignores case and accents', () => {
    expect(fold('Électron')).toBe('electron');
    const exercise = EXERCISES.find((e) => e.id === 'JNG-PC-10');
    if (!exercise) throw new Error('JNG-PC-10 missing');
    expect(matchesSearch(exercise, 'dipole rc')).toBe(true);
    expect(matchesSearch(exercise, 'DIPÔLE')).toBe(true);
    expect(matchesSearch(exercise, 'newton')).toBe(false);
  });

  it('finds an exercise by ID and combines text with the subject filter', () => {
    expect(filterExercises(EXERCISES, 'jng-pc-05', 'all').map((e) => e.id)).toEqual(['JNG-PC-05']);
    expect(filterExercises(EXERCISES, '', 'Chimie')).toHaveLength(6);
    expect(filterExercises(EXERCISES, 'newton', 'Chimie')).toHaveLength(0);
    expect(filterExercises(EXERCISES, '   ', 'all')).toHaveLength(14);
  });
});

describe('validation badge', () => {
  it('shows the pending badge for "À faire valider par un professeur"', () => {
    expect(getValidationLabel('À faire valider par un professeur')).toBe(
      'Corrigé à valider par un professeur',
    );
  });

  it('never claims a validation that the knowledge base does not state', () => {
    expect(getValidationLabel('')).toBe('Corrigé à valider par un professeur');
    expect(getValidationLabel('statut inconnu')).toBe('Corrigé à valider par un professeur');
  });

  it('shows "validé" only for an explicit "Validé" status', () => {
    expect(getValidationLabel('Validé par un professeur')).toBe('Corrigé validé par un professeur');
  });
});
