import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CategoryService } from '../../../services/category.service';
import { RecommendationService, RecommendationResult, AiHealth } from '../../../services/recommendation.service';
import { LiveEvent } from '../../components/live-status-card/live-status-card.component';
import { Event } from '../../../models/event.model';

interface Category {
  name: string;
  image: string;
  count: number;
}

@Component({
  selector: 'app-tourist-events',
  templateUrl: './tourist-events.component.html',
  styleUrls: ['./tourist-events.component.css']
})
export class TouristEventsComponent implements OnInit, OnDestroy {
  selectedId: number | null = null;
  selectedEvent: any = null;
  selectedEventModal: any = null;
  showEventModal = false;
  selectedExplanation: any = null;
  showExplanationModal = false;
  @ViewChild('track') track!: ElementRef;
  @ViewChild('outer') outer!: ElementRef;

  currentIndex = 0;
  autoTimer: any;
  autoplayInterval = 16000;
  cardWidth = 370; // Card width (350) + gap (20)
  
  categories: Category[] = [];
  isLoading = true;
  error: string | null = null;

  // Live status events
  liveEvents: LiveEvent[] = [];
  featuredEventsLoading = false;
  
  // Sticky CTA
  showStickyCta = false;

  // Reservations Modal
  showReservationsModal = false;

  // Trending Modal
  showTrendingModal = false;

  // Recommended Events
  recommendedEvents: any[] = [];
  recommendedLoading = false;
  recommendedError: string | null = null;
  private recommendationScores = new Map<number, number>();

  // AI engine info shown under the recommended grid (proves it's a real model)
  aiHealth: AiHealth | null = null;
  explanationLoading = false;

  // Booking flow modal state
  showBookingModal = false;
  selectedEventForBooking: Event | null = null;

  // Pagination
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;

  constructor(
    public router: Router, 
    private route: ActivatedRoute,
    private http: HttpClient,
    private categoryService: CategoryService,
    private recommendationService: RecommendationService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.selectedId = params['id'] ? +params['id'] : null;
      if (this.selectedId) {
        this.fetchEventById(this.selectedId);
      } else {
        this.selectedEvent = null;
      }
    });
    this.loadCategories();
    this.loadLiveEvents();
    this.loadRecommendedEvents();
    this.loadAiHealth();
    this.startAutoplay();
    this.checkScroll();
  }

  loadAiHealth() {
    this.recommendationService.getHealth().subscribe({
      next: (h: AiHealth) => { this.aiHealth = h; },
      error: () => { this.aiHealth = { available: false, modelName: 'LGBMRanker' }; }
    });
  }

// In loadRecommendedEvents:
loadRecommendedEvents() {
  this.recommendedLoading = true;
  this.recommendationService.getPersonalizedRecommendations().subscribe({
    next: (recs: RecommendationResult[]) => {
      this.recommendationScores = new Map(recs.map(r => [r.eventId, r.score]));
      this.http.get<any[]>('http://localhost:8081/api/events/event/upcoming').subscribe({
        next: (events) => {
          // LightGBM raw ranker scores are unbounded (often negative). Map them
          // to a 0-1 "match" using min-max within the user's recommended set so
          // the card badge ("78% Match") is meaningful rather than negative.
          const sorted = events
            .filter(e => this.recommendationScores.has(e.id))
            .map(e => ({ ...e, rawScore: this.recommendationScores.get(e.id) as number }))
            .sort((a, b) => b.rawScore - a.rawScore);

          if (sorted.length > 0) {
            const max = sorted[0].rawScore;
            const min = sorted[sorted.length - 1].rawScore;
            const range = max - min || 1;
            sorted.forEach((e, i) => {
              const norm = (e.rawScore - min) / range;
              // Compress to 0.55-0.99 so even the bottom rec still looks like a
              // real recommendation (we already filtered out non-candidates).
              e.score = 0.55 + 0.44 * norm;
            });
          }
          this.recommendedEvents = sorted.slice(0, 6);
          this.recommendedLoading = false;
        },
        error: () => { this.recommendedError = 'Failed to load events'; this.recommendedLoading = false; }
      });
    },
    error: () => { this.recommendedError = 'AI unavailable'; this.recommendedLoading = false; }
  });
}

  fetchEventById(id: number) {
    this.http.get<any>(`http://localhost:8081/api/events/event/get/${id}`).subscribe({
      next: (event) => {
        this.selectedEvent = event;
      },
      error: () => {
        this.selectedEvent = null;
      }
    });
  }

  ngOnDestroy() {
    this.stopAutoplay();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateCardWidth();
  }

  @HostListener('window:scroll')
  onScroll() {

    this.checkScroll();
  }

  checkScroll() {
    this.showStickyCta = window.scrollY > 400;
  }

  updateCardWidth() {
    const w = window.innerWidth;
  if (w < 660)      this.cardWidth = 260 + 24;  // card + gap
  else if (w < 960) this.cardWidth = 300 + 24;
  else              this.cardWidth = 340 + 24;   // 364
}

  loadCategories() {
    this.isLoading = true;
    this.error = null;
    
    this.categoryService.getAllCategoriesWithCounts()
      .subscribe({
        next: (categoriesWithCounts) => {
          console.log('TouristEvents: Categories loaded:', categoriesWithCounts);
          const categoryImages: { [key: string]: string } = {
            'MUSIC': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
            'FOOD': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
            'OUTDOOR': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80',
            'CULTURE': 'https://images.unsplash.com/photo-1513519245088-0e12902e35a5?w=400&q=80',
            'ART': 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80',
            'WORKSHOP': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&q=80',
            'SPORT': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
            'FESTIVAL': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=80',
            'TOUR': 'https://images.unsplash.com/photo-1548438294-1ad5d5f4f063?w=400&q=80',
            'FAMILY': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&q=80',
            'NIGHTLIFE': 'https://images.unsplash.com/photo-1516426122078-c43e5baf5639?w=400&q=80',
            'THEATER': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
            'OTHER': 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&q=80'
          };
          
          this.categories = categoriesWithCounts.map(cat => ({
            name: cat.name,
            image: categoryImages[cat.name] || categoryImages['OTHER'],
            count: cat.count
          }));
          this.isLoading = false;
          this.updateCardWidth();
          this.updatePagination();
        },
        error: (err) => {
          console.error('TouristEvents: Error loading categories:', err);
          this.isLoading = false;
          this.categories = [];
        }
      });
  }

  loadLiveEvents() {
    this.featuredEventsLoading = true;
    
    const API = 'http://localhost:8081/api';
    // Load upcoming events (for "Upcoming" tab)
    const upcomingApiUrl = `${API}/events/event/upcoming`;
    // Load last confirmed/waitlisted reservations (for "Last Reservation" tab)
    const reservationsApiUrl = `${API}/events/event-reservation/confirmed-waitlisted`; 
    console.log('TouristEvents: Calling upcoming API:', upcomingApiUrl);
    console.log('TouristEvents: Calling reservations API:', reservationsApiUrl);
    // Load both in parallel
    this.http.get<any[]>(upcomingApiUrl).subscribe({
      next: (events: any[]) => {
        console.log('TouristEvents: Received upcoming events:', events);  
        // Map upcoming events
        const upcomingEvents = events.slice(0, 3).map((event) => ({
          id: event.id,
          eventId: event.id,
          title: event.title,
          coverImage: event.media?.find((m: any) => m.isCover)?.url || 
                     'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80',
          startAt: event.startAt,
          location: event.location,
          price: event.price,
          status: event.status,
          type: 'Upcoming Event' as const,
          distance: this.getRandomDistance(),
          createdByUserId: event.createdByUserId || 0
        }));
        
        // Now load reservations
        this.http.get<any[]>(reservationsApiUrl).subscribe({
          next: (reservations: any[]) => {
            console.log('TouristEvents: Received reservations:', reservations);
            
             // Map reservations to live events (get the event details from reservation)
             const reservationEvents = reservations.slice(0, 3).map((reservation) => {
               const event = reservation.event || {};
           return {
             id: event.id,
             eventId: event.id,
             title: event.title,
             coverImage: event.media?.find((m: any) => m.isCover)?.url || 
                        'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80',
             startAt: event.startAt,
             location: event.location,
             price: event.price,
             status: event.status,
             type: 'Last Reservation' as const,
             distance: this.getRandomDistance(),
             createdByUserId: event.createdByUserId || 0
               };
             });
            
            // Combine both lists
            this.liveEvents = [...upcomingEvents, ...reservationEvents];
            console.log('TouristEvents: Combined liveEvents:', this.liveEvents);
            this.featuredEventsLoading = false;
          },
          error: (err) => {
            console.error('TouristEvents: Error loading reservations:', err);
            // Just show upcoming events if reservations fail
            this.liveEvents = upcomingEvents;
            this.featuredEventsLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('TouristEvents: Error loading upcoming events:', err);
        // Try to at least load reservations
        this.http.get<any[]>(reservationsApiUrl).subscribe({
          next: (reservations: any[]) => {
            this.liveEvents = reservations.slice(0, 3).map((reservation) => {
              const event = reservation.event || {};
              return {
                id: event.id || reservation.id,
                eventId: event.id || reservation.id,
                title: event.title || 'Event',
                coverImage: event.media?.find((m: any) => m.isCover)?.url || 
                           'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=80',
                startAt: event.startAt || new Date().toISOString(),
                location: event.location || 'TBD',
                price: event.price || 0,
                status: reservation.status,
                type: 'Last Reservation' as const,
                distance: this.getRandomDistance(),
                createdByUserId: event.createdByUserId || 0
              };
            });
            this.featuredEventsLoading = false;
          },
          error: (err2) => {
            console.error('TouristEvents: Error loading reservations:', err2);
            this.liveEvents = this.getDemoLiveEvents();
            this.featuredEventsLoading = false;
          }
        });
      }
    });
  }

  getRandomDistance(): string {
    const distances = ['1.2 km', '2.5 km', '3.8 km', '0.8 km', '5.1 km', 'Reached'];
    return distances[Math.floor(Math.random() * distances.length)];
  }

  getDemoLiveEvents(): LiveEvent[] {
    // Return empty array instead of hardcoded demo data
    return [];
  }

  // Centered carousel logic
 getTransform(): string {
  // Each card is 340px + 24px gap = 364px step
  const cardW = 340;
  const gap   = 24;
  const step  = cardW + gap;

  // Offset = move the track so currentIndex card sits at viewport center
  const offset = this.currentIndex * step;

  // containerHalf centers the track origin; cardHalf centers the card itself
  return `translateX(calc(50% - ${cardW / 2}px - ${offset}px))`;
}

  next() {
    if (this.currentIndex < this.categories.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0; // Loop back to start
    }
    this.resetAutoplay();
  }

  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.categories.length - 1; // Loop to end
    }
    this.resetAutoplay();
  }

  goTo(index: number) {
    this.currentIndex = index;
    this.resetAutoplay();
  }

  get dots(): number[] {

  const array = Array(this.paginatedCategories.length).fill(0).map((x, i) => i);
  return array.slice(0, Math.floor(array.length / 4));
}  

  startAutoplay() {
    this.autoTimer = setInterval(() => this.next(), this.autoplayInterval);
  }

  stopAutoplay() {
    if (this.autoTimer) clearInterval(this.autoTimer);
  }

  resetAutoplay() {
    this.stopAutoplay();
    this.startAutoplay();
  }

  goToCategory(category: string) {
    this.router.navigate(['../events/list'], {
      relativeTo: this.route,
      queryParams: { category }
    });
  }

  goToCategories() {
    this.router.navigate(['../events/list'], {
      relativeTo: this.route
    });
  }

  goToTrending() {
    this.showTrendingModal = true;
  }

  closeTrendingModal() {
    this.showTrendingModal = false;
  }

  goToMyReservations() {
    this.showReservationsModal = true;
  }

  closeReservationsModal() {
    this.showReservationsModal = false;
  }

  // Pagination methods
  updatePagination() {
    this.totalPages = Math.ceil(this.categories.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateCarouselForPage();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateCarouselForPage();
    }
  }

  goToPage(page: number | string) {
    if (typeof page === 'number') {
      this.currentPage = page;
      this.updateCarouselForPage();
    }
  }

  updateCarouselForPage() {
    // Calculate the starting index for the current page
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    if (startIndex < this.categories.length) {
      this.currentIndex = startIndex;
    }
  }

  get paginatedCategories(): Category[] {
    // Infinite circular carousel - duplicate categories to create continuous loop effect
    return [...this.categories, ...this.categories, ...this.categories];
  }

  getEndIndex(): number {
    const endIndex = this.currentPage * this.itemsPerPage;
    return Math.min(endIndex, this.categories.length);
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  viewEventDetails(event: any): void {
    // Navigate to event detail page
    this.router.navigate(['/tourist/events', event.id]);
  }

  onBookEvent(event: any): void {
    this.selectedEventForBooking = event;
    this.showBookingModal = true;
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.selectedEventForBooking = null;
  }

  onReservationSuccess(reservation: any): void {
    this.showBookingModal = false;
    this.selectedEventForBooking = null;
    // Optionally refresh data
  }

  openEventModal(event: any): void {
    this.selectedEventModal = event;
    this.showEventModal = true;
  }

  closeEventModal(): void {
    this.showEventModal = false;
    this.selectedEventModal = null;
  }

  openExplanationModal(event: any): void {
    this.showExplanationModal = true;
    this.explanationLoading = true;
    this.selectedExplanation = {
      eventId: event.id,
      eventTitle: event.title,
      score: event.score,
      rawScore: event.rawScore,
      reasons: []
    };
    this.recommendationService.explainRecommendation(event.id).subscribe({
      next: (resp: any) => {
        this.selectedExplanation = {
          ...this.selectedExplanation,
          reasons: resp?.reasons || []
        };
        this.explanationLoading = false;
      },
      error: () => {
        this.selectedExplanation = {
          ...this.selectedExplanation,
          reasons: ['AI service is currently unavailable.']
        };
        this.explanationLoading = false;
      }
    });
  }

  closeExplanationModal(): void {
    this.showExplanationModal = false;
    this.selectedExplanation = null;
  }
}
