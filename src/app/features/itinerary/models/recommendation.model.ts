/**
 * AI Recommendation System Models
 */

export interface RecommendationSearchRequest {
  maxBudget?: number;
  location?: string;
  limit?: number;
  minDuration?: number;
  maxDuration?: number;
  kNeighbors?: number;
  minRating?: number;
  exactLocationMatch?: boolean;
}

export interface Recommendation {
  itineraryId: string; // UUID
  title: string;
  description?: string;
  destination: string;
  budget: number;
  durationDays: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  numSteps: number;
  avgDailyCost: number;
  similarityScore: number; // 0.0 to 1.0
  rating: number; // 0.0 to 5.0
  numCollaborators: number;
  recommendationReason: string;
}

export interface RecommendationSearchResponse {
  success: boolean;
  count: number;
  recommendations: Recommendation[];
  message?: string;
  error?: string;
}

export interface TrainingStatistics {
  success: boolean;
  statistics: string;
}

export interface TrainingDataResponse {
  success: boolean;
  recordsGenerated?: number;
  message: string;
}
