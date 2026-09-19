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
  status: 'OPEN' | 'BUSY' | 'CLOSING_SOON' | 'CLOSED';
  operatingHours: string;
  bufferGroupActive: boolean;
  imageUrl: string;
  address: string;
  walkingDistanceMeters: number;
  walkingTimeMinutes: number;
  unavailableReason?: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  initials: string;
}

export const MOCK_USER: UserProfile = {
  name: 'Souro Mukherjee',
  phone: '+1 (555) 019-2834',
  initials: 'SM',
};

export const MOCK_VENUES: Record<string, QueueVenue> = {
  'BBC-402': {
    id: 'venue_bbc_01',
    name: 'Blue Bean Cafe',
    branch: 'City Centre Branch',
    code: 'BBC-402',
    category: 'Popular Cafe & Roastery · City Centre',
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
    category: 'Healthcare & Walk-in · Medical Quarter',
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
    category: 'Banking & Financial · Civic Plaza',
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
  'OFFLINE-99': {
    id: 'venue_off_99',
    name: 'Harbor Pharmacy & Wellness',
    branch: 'Dockside Terminal',
    code: 'OFFLINE-99',
    category: 'Retail Pharmacy · Harbor District',
    service: 'Prescription Dispensing',
    waitingPatrons: 0,
    estimatedWaitMinutes: 0,
    turnoverRateMinutes: 0,
    status: 'CLOSED',
    operatingHours: '08:00 AM – 06:00 PM',
    bufferGroupActive: false,
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80',
    address: '42 Marina Blvd, Pier 3',
    walkingDistanceMeters: 620,
    walkingTimeMinutes: 8,
    unavailableReason: 'This queue is currently closed. Operating hours are 08:00 AM – 06:00 PM.',
  },
  'REG-2026': {
    id: 'queue_reg_2026',
    name: 'Northfield University',
    branch: "Registrar's Office",
    code: 'REG-2026',
    category: 'Higher Education · Main Campus',
    service: 'Semester Registration',
    waitingPatrons: 18,
    estimatedWaitMinutes: 25,
    turnoverRateMinutes: 4.0,
    status: 'OPEN',
    operatingHours: '9:00 AM – 5:00 PM',
    bufferGroupActive: true,
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80',
    address: 'Main Administration Block, Campus',
    walkingDistanceMeters: 120,
    walkingTimeMinutes: 2,
  },
};

/**
 * Normalizes input code: removes whitespace, upper cases, and formats (e.g. "bbc402" -> "BBC-402").
 */
export function normalizeQueueCode(rawInput: string): string {
  const cleaned = rawInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length > 3 && !rawInput.includes('-')) {
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
  await new Promise((resolve) => setTimeout(resolve, 300));

  const normalized = normalizeQueueCode(rawInput);

  if (!normalized || normalized.length < 3) {
    return {
      success: false,
      error: 'Please enter a valid queue code (e.g., BBC-402).',
    };
  }

  if (MOCK_VENUES[normalized]) {
    return {
      success: true,
      venue: MOCK_VENUES[normalized],
    };
  }

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
    error: `Queue code "${normalized}" not found. Please check and try again.`,
  };
}

export type QueueLookupStatus = 'READY' | 'INVALID' | 'UNAVAILABLE';

/**
 * Fetches venue details for the Queue Details screen, returning state.
 */
export async function getVenueDetails(
  rawCode?: string
): Promise<{ status: QueueLookupStatus; venue?: QueueVenue; message?: string }> {
  // Simulate network fetch
  await new Promise((resolve) => setTimeout(resolve, 350));

  if (!rawCode) {
    return {
      status: 'INVALID',
      message: 'No queue code was provided. Please scan a valid venue QR code.',
    };
  }

  const normalized = normalizeQueueCode(rawCode);
  let matchedVenue: QueueVenue | undefined = MOCK_VENUES[normalized];

  if (!matchedVenue) {
    const cleanSearch = normalized.replace(/-/g, '');
    for (const key of Object.keys(MOCK_VENUES)) {
      if (key.replace(/-/g, '') === cleanSearch) {
        matchedVenue = MOCK_VENUES[key];
        break;
      }
    }
  }

  if (!matchedVenue) {
    return {
      status: 'INVALID',
      message: `Queue code "${rawCode}" could not be found in the Buffer network.`,
    };
  }

  if (matchedVenue.status === 'CLOSED') {
    return {
      status: 'UNAVAILABLE',
      venue: matchedVenue,
      message:
        matchedVenue.unavailableReason ||
        `${matchedVenue.name} is currently closed. Queuing is paused until opening hours.`,
    };
  }

  return {
    status: 'READY',
    venue: matchedVenue,
  };
}

export interface JoinedQueueTicket {
  token: string;
  venueName: string;
  venueBranch: string;
  service: string;
  partySize: string;
  seating: string;
  estimatedServiceTime: string;
  estimatedWaitMinutes: number;
  peopleAhead: number;
  callingNowToken: string;
}

/**
 * Simulates joining the queue and generating an active ticket.
 */
export async function joinQueue(
  venue: QueueVenue,
  partySize: string,
  seating: string
): Promise<JoinedQueueTicket> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const now = new Date();
  const serviceTime = new Date(now.getTime() + venue.estimatedWaitMinutes * 60000);
  const timeStr = serviceTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    token: 'B-042',
    venueName: venue.name,
    venueBranch: venue.branch,
    service: venue.service,
    partySize,
    seating,
    estimatedServiceTime: timeStr,
    estimatedWaitMinutes: venue.estimatedWaitMinutes,
    peopleAhead: venue.waitingPatrons,
    callingNowToken: 'B-036',
  };
}

export interface UniversalQueue {
  id: string;
  organizationName: string;
  departmentName: string;
  location: string;
  serviceName: string;
  queueCode: string;
  status: 'OPEN' | 'BUSY' | 'CLOSING_SOON' | 'CLOSED';
  operatingHours: string;
  breakTime?: string;
  estimatedWaitMinutes: number;
  averageProcessingMinutes: number;
  currentPhase: 'BUFFER' | 'FCFS';
  bufferStartedAt?: string;
  bufferClosesAt?: string;
  queueClosesAt?: string;
  filledCapacity: number;
  totalCapacity: number;
  note: string;
  program?: string;
  semester?: string;
  requiredDoc?: string;
  imageUrl: string;
  verified: boolean;
  unavailableReason?: string;
}

export const MOCK_UNIVERSAL_QUEUES: Record<string, UniversalQueue> = {
  'REG-2026': {
    id: 'queue_reg_2026',
    organizationName: 'Northfield University',
    departmentName: "Registrar's Office",
    location: 'Main Administration Block, Campus',
    serviceName: 'Semester Registration',
    queueCode: 'REG-2026',
    status: 'OPEN',
    operatingHours: '9:00 AM – 5:00 PM',
    breakTime: '1:00 PM – 2:00 PM',
    estimatedWaitMinutes: 25,
    averageProcessingMinutes: 4,
    currentPhase: 'BUFFER',
    bufferStartedAt: '2026-09-19T15:00:00+05:30',
    bufferClosesAt: '2026-09-19T15:30:00+05:30',
    queueClosesAt: '2026-09-19T16:00:00+05:30',
    filledCapacity: 42,
    totalCapacity: 60,
    note: 'Keep your university ID and registration documents ready.',
    program: 'B.Tech CSE',
    semester: '3',
    requiredDoc: 'Student ID',
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80',
    verified: true,
  },
  'CENTRAL-REG': {
    id: 'queue_central_reg',
    organizationName: 'Central University',
    departmentName: "Registrar's Office",
    location: 'Administration Block, Ground Floor',
    serviceName: 'Semester Registration',
    queueCode: 'REG-2026',
    status: 'OPEN',
    operatingHours: '9:00 AM – 4:00 PM',
    breakTime: '1:00 PM – 2:00 PM',
    estimatedWaitMinutes: 24,
    averageProcessingMinutes: 4,
    currentPhase: 'BUFFER',
    bufferStartedAt: '2026-09-19T15:00:00+05:30',
    bufferClosesAt: '2026-09-19T15:30:00+05:30',
    queueClosesAt: '2026-09-19T16:00:00+05:30',
    filledCapacity: 12,
    totalCapacity: 20,
    note: 'Keep your university ID and registration documents ready.',
    program: 'Undergraduate Program',
    semester: 'Spring 2026',
    requiredDoc: 'University ID & Form A',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&auto=format&fit=crop&q=80',
    verified: true,
  },
};

export function venueToUniversalQueue(venue: QueueVenue): UniversalQueue {
  return {
    id: venue.id,
    organizationName: venue.name,
    departmentName: venue.branch,
    location: venue.address,
    serviceName: venue.service,
    queueCode: venue.code,
    status: venue.status,
    operatingHours: venue.operatingHours,
    breakTime: '1:00 PM – 2:00 PM',
    estimatedWaitMinutes: venue.estimatedWaitMinutes,
    averageProcessingMinutes: Math.round(venue.turnoverRateMinutes) || 4,
    currentPhase: venue.bufferGroupActive ? 'BUFFER' : 'FCFS',
    filledCapacity: Math.max(venue.waitingPatrons * 3, 12),
    totalCapacity: Math.max(venue.waitingPatrons * 4, 20),
    note: 'Keep all required identification documents ready before your turn.',
    imageUrl: venue.imageUrl,
    verified: true,
    unavailableReason: venue.unavailableReason,
  };
}

export async function getUniversalQueueDetails(
  rawCode?: string
): Promise<{ status: QueueLookupStatus; queue?: UniversalQueue; message?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!rawCode) {
    return {
      status: 'INVALID',
      message: 'No queue code was provided. Please scan a valid queue QR code.',
    };
  }

  const normalized = normalizeQueueCode(rawCode);

  if (MOCK_UNIVERSAL_QUEUES[normalized]) {
    const q = MOCK_UNIVERSAL_QUEUES[normalized];
    if (q.status === 'CLOSED') {
      return {
        status: 'UNAVAILABLE',
        queue: q,
        message: q.unavailableReason || `${q.organizationName} queue is currently closed.`,
      };
    }
    return { status: 'READY', queue: q };
  }

  // Fallback to MOCK_VENUES converted
  const venueResult = await getVenueDetails(rawCode);
  if (venueResult.status === 'READY' && venueResult.venue) {
    return {
      status: 'READY',
      queue: venueToUniversalQueue(venueResult.venue),
    };
  }

  return {
    status: venueResult.status,
    queue: venueResult.venue ? venueToUniversalQueue(venueResult.venue) : undefined,
    message: venueResult.message,
  };
}

export async function joinUniversalQueue(
  queue: UniversalQueue
): Promise<JoinedQueueTicket> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const now = new Date();
  const serviceTime = new Date(now.getTime() + queue.estimatedWaitMinutes * 60000);
  const timeStr = serviceTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    token: 'REG-042',
    venueName: queue.organizationName,
    venueBranch: queue.departmentName,
    service: queue.serviceName,
    partySize: 'Individual',
    seating: 'Registration Desk',
    estimatedServiceTime: timeStr,
    estimatedWaitMinutes: queue.estimatedWaitMinutes,
    peopleAhead: Math.round(queue.filledCapacity * 0.4) || 6,
    callingNowToken: 'REG-036',
  };
}

