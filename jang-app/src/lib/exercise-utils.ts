import type { Exercise } from '../data/exercises';

export type Subject = 'Chimie' | 'Physique';
export type SubjectFilter = Subject | 'all';

const SEPARATOR = '—';

/** Subject is the prefix of the chapter label ("Chimie — Acides forts"). */
export function getSubject(chapter: string): Subject {
  return chapter.trim().startsWith('Chimie') ? 'Chimie' : 'Physique';
}

/** Chapter label without its subject prefix. */
export function getChapterTitle(chapter: string): string {
  const index = chapter.indexOf(SEPARATOR);
  return index === -1 ? chapter.trim() : chapter.slice(index + SEPARATOR.length).trim();
}

/** Lowercase and strip accents so "ph", "PH" and "Ph" match, as do "electron" and "électron". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function matchesSearch(exercise: Exercise, query: string): boolean {
  const needle = fold(query).trim();
  if (needle === '') return true;
  const haystack = fold([exercise.id, exercise.chapter, exercise.statement, exercise.data].join(' '));
  return needle.split(/\s+/).every((word) => haystack.includes(word));
}

export function filterExercises(
  exercises: readonly Exercise[],
  query: string,
  subject: SubjectFilter,
): Exercise[] {
  return exercises.filter(
    (exercise) =>
      (subject === 'all' || getSubject(exercise.chapter) === subject) && matchesSearch(exercise, query),
  );
}

/**
 * The knowledge base says "À faire valider par un professeur" until a teacher signs off.
 * Anything that does not explicitly start with "Validé" counts as pending, so the UI
 * never claims a validation that was not recorded.
 */
export function isPendingValidation(validation: string): boolean {
  return !/^valid[ée](\s|$)/i.test(validation.trim());
}

export function getValidationLabel(validation: string): string {
  return isPendingValidation(validation)
    ? 'Corrigé à valider par un professeur'
    : 'Corrigé validé par un professeur';
}
