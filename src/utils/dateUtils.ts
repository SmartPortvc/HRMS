export const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getWeekRange = (date: Date) => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay() + 1); // Monday
  const end = new Date(date);
  end.setDate(date.getDate() - date.getDay() + 5); // Friday
  return `${formatDate(start)} - ${formatDate(end)}`;
};