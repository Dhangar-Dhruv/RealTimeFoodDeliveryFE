import { TRestaurant } from '../types/userTypes';
import { RAW_RESTAURANTS } from '../assets/foodDeliveryConstants';

export function parseRestaurants(): TRestaurant[] {
  return RAW_RESTAURANTS.map((raw) => {
    const parts = raw.split('|');
    return {
      name: parts[0],
      cuisines: parts[1].split(',').map((c) => c.trim()),
      rating: parseFloat(parts[2]),
      deliveryFee: parseInt(parts[3], 10),
      status: parts[4] as 'Open' | 'Closed',
      deliveryTime: parseInt(parts[5], 10),
      reviewCount: parseInt(parts[6], 10),
      imageUrl: parts[7],
    };
  });
}

export function generateOrderId(): string {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

export function getInitials(name: string): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

const DELIVERY_NAMES = [
  'Rahul Sharma', 'Priya Singh', 'Amit Kumar', 'Deepa Patel',
  'Vikram Joshi', 'Anita Rao', 'Suresh Nair', 'Kavita Gupta'
];

const DELIVERY_PHONES = [
  '+91 98765 43210', '+91 87654 32109', '+91 76543 21098', '+91 65432 10987',
  '+91 54321 09876', '+91 43210 98765', '+91 32109 87654', '+91 21098 76543'
];

export function getRandomDeliveryPerson() {
  const i = Math.floor(Math.random() * DELIVERY_NAMES.length);
  return { name: DELIVERY_NAMES[i], phone: DELIVERY_PHONES[i] };
}
