
import { LevelConfig } from './types';

export const LEVELS: LevelConfig[] = [
  { id: 1, name: 'Pirineus', topic: 'Operacions bàsiques (Sumes i restes)', difficulty: 'Fàcil', color: 'bg-emerald-500', bgEmoji: '🏔️' },
  { id: 2, name: 'Costa Brava', topic: 'Multiplicacions i divisions', difficulty: 'Normal', color: 'bg-blue-400', bgEmoji: '🏖️' },
  { id: 3, name: 'Pla de Lleida', topic: 'Fraccions i parts', difficulty: 'Normal', color: 'bg-yellow-400', bgEmoji: '🚜' },
  { id: 4, name: 'Montserrat', topic: 'Números decimals i moneda', difficulty: 'Mitjana', color: 'bg-gray-400', bgEmoji: '⛪' },
  { id: 5, name: 'Ebre', topic: 'Unitats de mesura (kg, l, m)', difficulty: 'Mitjana', color: 'bg-indigo-400', bgEmoji: '🚣' },
  { id: 6, name: 'Tarraco', topic: 'Geometria i formes', difficulty: 'Avançada', color: 'bg-orange-400', bgEmoji: '🏛️' },
  { id: 7, name: 'Girona Medieval', topic: 'Problemes de lògica', difficulty: 'Avançada', color: 'bg-stone-500', bgEmoji: '🏰' },
  { id: 8, name: 'Barcelona Final', topic: 'Repàs General', difficulty: 'Repte Final', color: 'bg-red-500', bgEmoji: '⛪' },
];

export const TOTAL_QUESTIONS_PER_LEVEL = 10;
