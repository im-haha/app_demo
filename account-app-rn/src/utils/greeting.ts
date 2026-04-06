export function getGreeting(date: Date = new Date()): string {
  const hour = date.getHours();

  if (hour < 5) {
    return '夜深了';
  }
  if (hour < 11) {
    return '早上好';
  }
  if (hour < 13) {
    return '中午好';
  }
  if (hour < 18) {
    return '下午好';
  }
  return '晚上好';
}

export function getNextGreetingChangeTime(date: Date = new Date()): Date {
  const next = new Date(date);
  next.setSeconds(0, 0);

  const hour = date.getHours();

  if (hour < 5) {
    next.setHours(5, 0, 0, 0);
    return next;
  }

  if (hour < 11) {
    next.setHours(11, 0, 0, 0);
    return next;
  }

  if (hour < 13) {
    next.setHours(13, 0, 0, 0);
    return next;
  }

  if (hour < 18) {
    next.setHours(18, 0, 0, 0);
    return next;
  }

  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}
