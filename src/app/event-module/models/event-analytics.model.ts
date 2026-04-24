export interface EventAnalytics {
  totalEvents: number;
  totalRevenue: number;
  totalAttendance: number;
  totalBookings: number;
  topHostName: string;
  topHostPerformance: number;
  averageRating: number;
  eventsByStatus: {
    [key: string]: number;
  };
  monthlyStats: MonthlyStats[];
}

export interface DashboardSummary {
  totalEvents: number;
  activeEvents: number;
  totalRevenue: number;
  totalUsers: number;
  pendingApprovals: number;
  recentActivities: ActivityItem[];
}

export interface ActivityItem {
  id: number;
  type: ActivityType;
  description: string;
  timestamp: string;
  userId?: number;
  eventId?: number;
}

export enum ActivityType {
  EVENT_CREATED = 'EVENT_CREATED',
  EVENT_UPDATED = 'EVENT_UPDATED',
  EVENT_DELETED = 'EVENT_DELETED',
  EVENT_APPROVED = 'EVENT_APPROVED',
  EVENT_PUBLISHED = 'EVENT_PUBLISHED',
  USER_REGISTERED = 'USER_REGISTERED',
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED'
}

export interface MonthlyStats {
  month: string;
  events: number;
  revenue: number;
  bookings: number;
}

export interface EventFilter {
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}
