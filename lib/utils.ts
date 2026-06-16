export function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    date: start.toISOString().split("T")[0],
  };
}
