export function formatRelativeTime(timestamp) {
  if (!timestamp) return "UNKNOWN";

  // Handle Firebase Timestamps (they have a toDate() method)
  let date;
  if (typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    // Fallback if it's already a date
    date = timestamp;
  }

  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return "SYNCED JUST NOW";
  if (diffInMinutes < 60) return `SYNCED ${diffInMinutes} MINS AGO`;
  if (diffInHours < 24) return `SYNCED ${diffInHours} HRS AGO`;
  return `SYNCED ${diffInDays} DAYS AGO`;
}
