export function calculateDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 2) return 0; // Free delivery
  if (distanceKm <= 5) return 2; // Rs 2
  return 5; // Rs 5 (cap)
}

export function isPeakHour(): boolean {
  const hour = new Date().getHours();
  return (hour >= 12 && hour < 14) || (hour >= 19 && hour < 21);
}
