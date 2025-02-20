import { Todo } from "@prisma/client"

export const SCORING_RULES = {
  BASE_POINTS: 10,
  EARLY_COMPLETION_BONUS: 5, // Bonus for completing >2 hours before deadline
  FAILURE_PENALTY: -5, // Points lost for not completing by deadline
  RANKS: [
    { name: 'Novice', minScore: 0, color: 'text-gray-500' },
    { name: 'Rising Star', minScore: 50, color: 'text-blue-500' },
    { name: 'Expert', minScore: 100, color: 'text-green-500' },
    { name: 'Master', minScore: 200, color: 'text-purple-500' },
    { name: 'Champion', minScore: 500, color: 'text-yellow-500' },
  ] as const
}

export function calculateTaskPoints(todo: Todo, completionTime: Date): number | null {
  // Only award points if not already awarded and task is being completed
  if (todo.pointsAwarded || todo.completed) return null;

  let points = SCORING_RULES.BASE_POINTS;

  // Early completion bonus (if completed >2 hours before deadline)
  const hoursBeforeDeadline = (todo.deadline.getTime() - completionTime.getTime()) / (1000 * 60 * 60);
  if (hoursBeforeDeadline > 2) {
    points += SCORING_RULES.EARLY_COMPLETION_BONUS;
  }

  return points;
}

export function getRank(score: number) {
  return [...SCORING_RULES.RANKS]
    .reverse()
    .find(rank => score >= rank.minScore) || SCORING_RULES.RANKS[0];
} 