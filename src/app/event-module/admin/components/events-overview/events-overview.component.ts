import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Reservation, ReservationService } from '../../../services/reservation.service';
import { EventService } from '../../../services/event.service';
import { CategoryService } from '../../../services/category.service';
import { Event, EventStatus } from '../../../models/event.model';

interface MonthlyStats {
  month: string;
  events: number;
  revenue: number;
  bookings: number;
}

interface AdminEvent extends Event {
  selected?: boolean;
}

@Component({
  selector: 'app-events-overview',
  templateUrl: './events-overview.component.html',
  styleUrls: ['./events-overview.component.css']
})
export class EventsOverviewComponent implements OnInit {

  @Input() events: AdminEvent[] = [];
  @Input() bookings: Reservation[] = [];
  @Input() reviews: any[] = [];

  @Output() tabChange = new EventEmitter<string>();

  loading: boolean = false;
  error: string = '';

  sentimentCache: any = {
    positive: 0,
    neutral: 0,
    negative: 0,
    totalReviews: 0
  };

  ngOnChanges() {
    this.sentimentCache = this.computeSentiment();
  }

  computeSentiment() {
    const total = this.reviews?.length || 1;
    const positive = this.reviews?.filter(r => r.rating >= 4).length || 0;
    const neutral = this.reviews?.filter(r => r.rating === 3).length || 0;
    const negative = this.reviews?.filter(r => r.rating <= 2).length || 0;

    return {
      positive: (positive / total) * 100,
      neutral: (neutral / total) * 100,
      negative: (negative / total) * 100,
      totalReviews: this.reviews?.length || 0
    };
  }

  // Monthly trends data
  monthlyTrends: { month: string; revenue: number; bookings: number }[] = [];

  // Stats for overview
  stats: any = {};

  private destroy$ = new Subject<void>();

  constructor(
    public router: Router,
    private eventService: EventService,
    private categoryService: CategoryService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    // Data is now loaded ONCE in parent component - NO INTERNAL API CALLS
  }

  // Use bookings as the single source of truth for revenue and bookings per month
  calculateMonthlyStats(): MonthlyStats[] {
    const monthlyData: { [key: string]: { events: number; revenue: number; bookings: number } } = {};

    this.bookings.forEach(booking => {
      if (booking.createdAt) {
        const date = new Date(booking.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { events: 0, revenue: 0, bookings: 0 };
        }

        monthlyData[monthKey].revenue += booking.totalPrice || 0;
        monthlyData[monthKey].bookings += 1;
      }
    });

    // Count events per month using events' startAt
    this.events.forEach(event => {
      if (event.startAt) {
        const date = new Date(event.startAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { events: 0, revenue: 0, bookings: 0 };
        }
        monthlyData[monthKey].events += 1;
      }
    });

    return Object.keys(monthlyData)
      .sort()
      .map(month => ({
        month,
        events: monthlyData[month].events,
        revenue: monthlyData[month].revenue,
        bookings: monthlyData[month].bookings
      }));
  }

  // Calculate growth percentage between two values
  calculateGrowth(current: number, previous: number): number {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  }

  // Revenue growth % (bookings-based)
  getRevenueGrowth(): number {
    const data = this.calculateMonthlyStats();
    if (data.length < 2) return 0;
    const last = data[data.length - 1].revenue;
    const prev = data[data.length - 2].revenue;
    return this.calculateGrowth(last, prev);
  }

  // Fill rate = booked seats / total capacity
  getFillRate(): number {
    const booked = this.events.reduce((sum, e) => sum + (e.bookedSeats || 0), 0);
    const capacity = this.events.reduce((sum, e) => sum + (e.capacity || 0), 0);
    if (!capacity) return 0;
    return (booked / capacity) * 100;
  }

  // Conversion rate = bookings / total capacity
  getConversionRate(): number {
    const totalBookings = this.getTotalBookingsCount();
    const totalCapacity = this.events.reduce((sum, e) => sum + (e.capacity || 0), 0);
    if (!totalCapacity) return 0;
    return (totalBookings / totalCapacity) * 100;
  }

  getCategoriesWithCount(): { name: string; count: number; percentage: number; color: string }[] {
    const categoryCount: { [key: string]: number } = {};
    const colors = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
    
    this.events.forEach(event => {
      const category = event.category || 'Other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const total = this.events.length || 1;
    const entries = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);
    
    return entries.map(([name, count], i) => ({
      name,
      count,
      percentage: (count / total) * 100,
      color: colors[i % colors.length]
    }));
  }

  getMonthlyTrends(): { month: string; revenue: number; percentage: number }[] {
    const monthlyData = this.calculateMonthlyStats();
    const maxRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);
    
    return monthlyData.slice(-6).map(m => ({
      month: m.month.substring(5), // Get MM from YYYY-MM
      revenue: m.revenue,
      percentage: (m.revenue / maxRevenue) * 100
    }));
  }

  getStatusData(): { name: string; count: number; percentage: number; color: string }[] {
    const statuses = [
      { name: 'Upcoming', count: this.getUpcomingCount(), color: '#10b981' },
      { name: 'Ongoing', count: this.getOngoingCount(), color: '#f59e0b' },
      { name: 'Full', count: this.getFullCount(), color: '#3b82f6' },
      { name: 'Canceled', count: this.getCanceledCount(), color: '#ef4444' },
      { name: 'Finished', count: this.events.filter(e => e.status === 'FINISHED').length, color: '#6b7280' },
    ];
    
    const total = this.events.length || 1;
    return statuses.map(s => ({
      ...s,
      percentage: (s.count / total) * 100
    }));
  }

  getTimelineData(): { month: string; count: number; position: number }[] {
    const monthlyData = this.calculateMonthlyStats();
    const last6Months = monthlyData.slice(-6);
    const maxCount = Math.max(...last6Months.map(m => m.events), 1);
    
    return last6Months.map((m, i) => ({
      month: m.month.substring(5),
      count: m.events,
      position: (i / (last6Months.length - 1 || 1)) * 100
    }));
  }

  getUpcomingCount(): number {
    return this.events.filter(e => e.status === 'UPCOMING').length;
  }

  getOngoingCount(): number {
    return this.events.filter(e => e.status === 'ONGOING').length;
  }

  getCanceledCount(): number {
    return this.events.filter(e => e.status === 'CANCELED').length;
  }


  getFullCount(): number {
    return this.events.filter(e => e.status === 'FULL').length;
  }

  getTotalBookingsCount(): number {
    return this.events.reduce((sum, e) => sum + (e.bookedSeats || 0), 0);
  }

  getTotalRevenue(): number {
    return this.bookings
      .filter(b => b.paymentStatus === 'PAID')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  }

  // Compute average rating from reviews
  getAverageRating(): number {
    if (!this.reviews || !this.reviews.length) return 0;
    return this.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / this.reviews.length;
  }

  getConfirmedBookingsCount(): number {
    return this.bookings.filter(b => b.status === 'CONFIRMED').length;
  }

  getPaidBookingsCount(): number {
    return this.bookings.filter(b => b.paymentStatus === 'PAID').length;
  }

  getPendingBookingsCount(): number {
    return this.bookings.filter(b => b.paymentStatus === 'PENDING').length;
  }

  getCategoryDonutStyle(): { [key: string]: string } {
    const categories = this.getCategoriesWithCount();
    const colors = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6'];
    let gradient = 'conic-gradient(';
    let startAngle = 0;
    
    categories.forEach((cat, i) => {
      const angle = (cat.percentage / 100) * 360;
      gradient += `${colors[i % colors.length]} ${startAngle}deg ${startAngle + angle}deg,`;
      startAngle += angle;
    });
    
    gradient = gradient.slice(0, -1) + ')';
    return { background: gradient };
  }

  // Quick Action Methods
  addEvent(): void {
    this.router.navigate(['/admin/events/create']);
  }

  viewPendingBookings(): void {
    this.tabChange.emit('bookings');
  }

  manageReviews(): void {
    this.tabChange.emit('reviews');
  }

  exportAnalytics(): void {
    const data = [
      ['Metric', 'Value'],
      ['Total Events', this.events.length],
      ['Upcoming Events', this.getUpcomingCount()],
      ['Total Bookings', this.getTotalBookingsCount()],
      ['Total Revenue', this.getTotalRevenue() + ' EUR'],
    ];
    
    const csv = data.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 openEvent(event: any) {
  this.router.navigate(['/admin/events', event.id]);
} 

// Ensures type compatibility for map component
get mapEvents() {
  return this.events
    .filter(e => typeof e.latitude === 'number' && typeof e.longitude === 'number')
    .map(e => ({
      ...e,
      id: typeof e.id === 'string' ? parseInt(e.id, 10) : e.id,
      latitude: e.latitude as number,
      longitude: e.longitude as number,
      status: mapStatus(e.status)
    }));

  function mapStatus(status: any): "PENDING" | "APPROVED" | "REJECTED" | undefined {
    if (!status) return undefined;
    if (typeof status === 'string') {
      if (["PENDING", "APPROVED", "REJECTED"].includes(status)) return status as any;
      return undefined;
    }
    // Enum mapping fallback
    switch (status) {
      case 0: // EventStatus.PENDING
      case 'PENDING':
        return "PENDING";
      case 1: // EventStatus.APPROVED
      case 'APPROVED':
        return "APPROVED";
      case 2: // EventStatus.REJECTED
      case 'REJECTED':
        return "REJECTED";
      default:
        return undefined;
    }
  }
}

}
