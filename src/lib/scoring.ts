import { Todo } from "@prisma/client"

export const SCORING_RULES = {
  BASE_POINTS: 10,
  EARLY_COMPLETION_BONUS: 5, // Bonus for completing well before deadline
  STREAK_BONUS: 2, // Multiplier for completing multiple tasks in a row
  FAILURE_PENALTY: -5, // Points lost for not completing task by deadline
}

export function calculateTaskPoints(todo: Todo, completionTime: Date): number {
  let points = todo.points

  // Early completion bonus (if completed >2 hours before deadline)
  const hoursBeforeDeadline = (todo.deadline.getTime() - completionTime.getTime()) / (1000 * 60 * 60)
  if (hoursBeforeDeadline > 2) {
    points += SCORING_RULES.EARLY_COMPLETION_BONUS
  }

  return points
} 