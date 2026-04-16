// ─── Enums ───────────────────────────────────────────
export type ItineraryStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type Visibility = 'PRIVATE' | 'PUBLIC';
export type CollaboratorRole = 'OWNER' | 'EDITOR' | 'VIEWER';
export type CollaboratorStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REMOVED';
export type ServiceType = 'EVENT' | 'TRANSPORT' | 'ACCOMMODATION';
export type ExpenseCategory = 'TRANSPORT' | 'ACCOMMODATION' | 'FOOD' | 'EVENT' | 'OTHER';
export type SettlementStatus = 'PENDING' | 'PAID';

// ─── Itinerary ────────────────────────────────────────
export interface Itinerary {
  id: string;
  ownerId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  destinationRegion: string;
  estimatedBudget: number;
  actualBudget: number;
  status: ItineraryStatus;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  steps: ItineraryStep[];
  collaborators: Collaborator[];
}

export interface ItineraryRequest {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  destinationRegion?: string;
  estimatedBudget?: number;
  status?: ItineraryStatus;
  visibility?: Visibility;
}

// ─── Step ─────────────────────────────────────────────
export interface ItineraryStep {
  id: string;
  addedByUserId: number;
  serviceType: ServiceType;
  serviceRefId: string;
  title: string;
  notes: string;
  plannedDate: string;
  position: number;
  estimatedCost: number;
  actualCost: number;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
  serviceDetails?: any;
}

export interface ItineraryStepRequest {
  serviceType: ServiceType;
  serviceRefId: string;
  title: string;
  notes?: string;
  plannedDate?: string;
  position?: number;
  estimatedCost?: number;
  actualCost?: number;
  latitude?: number;
  longitude?: number;
}

// ─── Collaborator ─────────────────────────────────────
export interface Collaborator {
  id: string;
  userId: number;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  requestedAt: string;
  joinedAt: string;
}

// ─── Expense ──────────────────────────────────────────
export interface Expense {
  id: string;
  itineraryId: string;
  paidByUserId: number;
  category: ExpenseCategory;
  amount: number;
  description: string;
  expenseDate: string;
  createdAt: string;
}

export interface ExpenseRequest {
  category: ExpenseCategory;
  amount: number;
  description?: string;
  expenseDate: string;
}

// ─── Settlement ───────────────────────────────────────
export interface SettlementItem {
  id: string;
  debtorUserId: number;
  creditorUserId: number;
  amount: number;
  status: SettlementStatus;
  settledAt: string | null;
}

export interface SettlementSummary {
  userId: number;
  totalPaid: number;
  equalShare: number;
  netBalance: number;
  computedAt: string;
  owes: SettlementItem[];
  owedBy: SettlementItem[];
}