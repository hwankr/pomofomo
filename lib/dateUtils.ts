/**
 * Date utility functions for handling day boundaries with 5 AM reset
 * This accounts for the app's concept of a "day" starting at 5 AM
 */

/**
 * Get the start of the current "day" (5 AM reset time)
 * If the current time is before 5 AM, it returns 5 AM of the previous calendar day
 */
export function getDayStart(date: Date = new Date()): Date {
  const resetHour = 5; // 5 AM reset
  const result = new Date(date);
  
  if (result.getHours() < resetHour) {
    // Before 5 AM, so the "day" started yesterday at 5 AM
    result.setDate(result.getDate() - 1);
  }
  
  result.setHours(resetHour, 0, 0, 0);
  return result;
}

/**
 * Get the end of the current "day" (just before next 5 AM reset)
 * Returns 4:59:59.999 AM of the next calendar day
 */
export function getDayEnd(date: Date = new Date()): Date {
  const resetHour = 5; // 5 AM reset
  const result = new Date(date);
  
  if (result.getHours() < resetHour) {
    // Before 5 AM, so the "day" ends today at 5 AM
    result.setHours(resetHour - 1, 59, 59, 999);
  } else {
    // After 5 AM, so the "day" ends tomorrow at 5 AM
    result.setDate(result.getDate() + 1);
    result.setHours(resetHour - 1, 59, 59, 999);
  }
  
  return result;
}
