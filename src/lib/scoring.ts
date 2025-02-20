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

export function calculateTaskPoints(todo: { 
  completed: boolean, 
  pointsAwarded: boolean, 
  amendedOnce: boolean 
}, now: Date) {
  // If marking as completed and points haven't been awarded yet
  if (todo.completed && !todo.pointsAwarded) {
    const hour = now.getHours();
    return hour < 12 ? 15 : 10; // Bonus points for early completion
  }

  // If uncompleting a task that was awarded points and hasn't been amended
  if (!todo.completed && todo.pointsAwarded && !todo.amendedOnce) {
    return -15; // Deduct the points that were awarded
  }

  return 0; // No points for other cases (like re-completing after uncompleting)
}

export function getRank(score: number) {
  return [...SCORING_RULES.RANKS]
    .reverse()
    .find(rank => score >= rank.minScore) || SCORING_RULES.RANKS[0];
} 