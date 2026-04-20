/**
 * Event Review Model
 * Represents a review submitted by a tourist for an event
 */
export interface EventReview {
  id: number;
  eventId: number;
  userId: number;
  reservationId: number;
  rating: number;
  comment: string;
  hostResponse?: string;
  sentimentScore?: number;
  createdAt: string;
  // Optional fields populated by backend joins
  userName?: string;
  userAvatar?: string;
  event?: {
    id: number;
    title: string;
  };
}

/**
 * Review Eligibility Response
 * Used to check if a user can review an event
 */
export interface ReviewEligibility {
  canReview: boolean;
  reservationId: number | null;
  alreadyReviewed: boolean;
  userId?: number;
  reservationStatus?: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'PENDING';
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
}

/**
 * Review Summary
 * Used for displaying average rating and count
 */
export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

/**
 * Create Review Payload
 * Sent when creating a new review
 */
export interface CreateReviewPayload {
  eventId: number;
  userId: number;
  reservationId: number;
  rating: number;
  comment: string;
}

/**
 * Update Review Payload
 * Sent when updating an existing review
 */
export interface UpdateReviewPayload {
  rating: number;
  comment: string;
}