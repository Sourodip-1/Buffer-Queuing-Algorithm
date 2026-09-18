export interface QueueVenue {
  id: string;
  name: string;
  branch: string;
  code: string;
  category: string;
  service: string;
  waitingPatrons: number;
  estimatedWaitMinutes: number;
  turnoverRateMinutes: number;
  status: 'OPEN' | 'BUSY' | 'CLOSING_SOON';
  operatingHours: string;
  bufferGroupActive: boolean;
  imageUrl: string;
  address: string;
  walkingDistanceMeters: number;
  walkingTimeMinutes: number;
}

export const MOCK_VENUES: Record<string, QueueVenue> = {
  'BBC-402': {
    id: 'venue_bbc_01',
    name: 'Blue Bean Cafe',
    branch: 'City Centre Branch',
    code: 'BBC-402',
    category: 'Popular Cafe & Roastery',
    service: 'Table Queue (Dining & Drinks)',
    waitingPatrons: 12,
    estimatedWaitMinutes: 25,
    turnoverRateMinutes: 3.5,
    status: 'OPEN',
    operatingHours: '10:00 AM – 10:00 PM',
    bufferGroupActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80',
    address: '74 Market Street, City Centre District',
    walkingDistanceMeters: 180,
    walkingTimeMinutes: 2,
  },
  'MC-101': {
    id: 'venue_mc_02',
    name: 'Metro Health Urgent Care',
    branch: 'Downtown Clinic',
    code: 'MC-101',
    category: 'Healthcare & Walk-in',
    service: 'General Physician Triage',
    waitingPatrons: 7,
    estimatedWaitMinutes: 18,
    turnoverRateMinutes: 5.0,
    status: 'OPEN',
    operatingHours: '08:00 AM – 08:00 PM',
    bufferGroupActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
    address: '120 Hospital Way, Medical Quarter',
    walkingDistanceMeters: 450,
    walkingTimeMinutes: 6,
  },
  'FB-808': {
    id: 'venue_fb_03',
    name: 'First City Bank',
    branch: 'Central Financial Hub',
    code: 'FB-808',
    category: 'Banking & Financial',
    service: 'Teller & Cash Services',
    waitingPatrons: 4,
    estimatedWaitMinutes: 10,
    turnoverRateMinutes: 2.5,
    status: 'OPEN',
    operatingHours: '09:00 AM – 04:30 PM',
    bufferGroupActive: false,
    imageUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=600&auto=format&fit=crop&q=80',
    address: '10 Wallington Ave, Civic Plaza',
    walkingDistanceMeters: 280,
    walkingTimeMinutes: 3,
  },
};

/**
 * Normalizes input code: removes whitespace, upper cases, and formats (e.g. "bbc402" -> "BBC-402").
 */
export function normalizeQueueCode(rawInput: string): string {
  const cleaned = rawInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length > 3 && !rawInput.includes('-')) {
    // Check if it starts with letters and ends with numbers (e.g., BBC402 -> BBC-402)
    const match = cleaned.match(/^([A-Z]+)(\d+)$/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
  }
  return rawInput.trim().toUpperCase();
}

/**
 * Validates a queue code against the mock database with simulated latency.
 */
export async function validateQueueCode(
  rawInput: string
): Promise<{ success: boolean; venue?: QueueVenue; error?: string }> {
  // Simulate network latency (400ms)
  await new Promise((resolve) => setTimeout(resolve, 400));

  const normalized = normalizeQueueCode(rawInput);

  if (!normalized || normalized.length < 3) {
    return {
      success: false,
      error: 'Please enter a valid queue code (e.g., BBC-402).',
    };
  }

  // Check direct match
  if (MOCK_VENUES[normalized]) {
    return {
      success: true,
      venue: MOCK_VENUES[normalized],
    };
  }

  // Check match by stripping hyphens (e.g., BBC402 matches BBC-402)
  const cleanSearch = normalized.replace(/-/g, '');
  for (const key of Object.keys(MOCK_VENUES)) {
    if (key.replace(/-/g, '') === cleanSearch) {
      return {
        success: true,
        venue: MOCK_VENUES[key],
      };
    }
  }

  return {
    success: false,
    error: `Queue code "${normalized}" not found. Please verify the kiosk code and try again.`,
  };
}
