// Utility function to calculate availability status based on dates
export function calculateAvailabilityStatus(availableFrom?: Date): string {
  if (!availableFrom) {
    return "Available now";
  }

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfAvailableDate = new Date(availableFrom.getFullYear(), availableFrom.getMonth(), availableFrom.getDate());
  
  // Calculate the difference in days
  const timeDiff = startOfAvailableDate.getTime() - startOfToday.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  // Get day of week for both dates
  const todayDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const availableDayOfWeek = availableFrom.getDay();
  
  // Calculate current week boundaries
  const daysUntilSunday = 7 - todayDayOfWeek; // Days until next Sunday (start of next week)
  const daysUntilNextSunday = daysUntilSunday + 7; // Days until the Sunday after next week
  
  if (daysDiff <= 0) {
    return "Available now";
  } else if (daysDiff <= daysUntilSunday) {
    return "Available later this week";
  } else if (daysDiff <= daysUntilNextSunday) {
    return "Available next week";
  } else {
    return "Available later than next week";
  }
}