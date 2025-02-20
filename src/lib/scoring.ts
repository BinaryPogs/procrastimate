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

interface TaskState {
  completed: boolean
  pointsAwarded: boolean
  amendedOnce: boolean
}

export function calculateTaskPoints(
  previousState: TaskState,
  newState: { completed: boolean }
): number {
  const hour = new Date().getHours()
  const basePoints = hour < 12 ? 15 : 10 // More points for early completion

  // Completing a task
  if (newState.completed && !previousState.completed) {
    return basePoints
  }

  // Uncompleting a task
  if (!newState.completed && previousState.completed) {
    return -basePoints // Deduct the same amount that was awarded
  }

  return 0 // No points for other cases
}

export function getRank(score: number) {
  return [...SCORING_RULES.RANKS]
    .reverse()
    .find(rank => score >= rank.minScore) || SCORING_RULES.RANKS[0];
} 