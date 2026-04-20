import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Itinerary, ItineraryRequest,
  ItineraryStep, ItineraryStepRequest,
  Collaborator,
  Expense, ExpenseRequest,
  SettlementSummary, SettlementItem,
  CollaboratorRole
} from '../models/itinerary.model';

@Injectable({ providedIn: 'root' })
export class ItineraryService {

  private api = 'http://localhost:8081/api/itineraries';

  constructor(private http: HttpClient) {}

  // ─── Itinerary CRUD ───────────────────────────────
  create(request: ItineraryRequest): Observable<Itinerary> {
    return this.http.post<Itinerary>(this.api, request);
  }

  getById(id: string): Observable<Itinerary> {
    return this.http.get<Itinerary>(`${this.api}/${id}`);
  }

  getMyItineraries(): Observable<Itinerary[]> {
    return this.http.get<Itinerary[]>(`${this.api}/my`);
  }

  getPublicItineraries(): Observable<Itinerary[]> {
    return this.http.get<Itinerary[]>(`${this.api}/public`);
  }

  update(id: string, request: ItineraryRequest): Observable<Itinerary> {
    return this.http.put<Itinerary>(`${this.api}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  // ─── Collaborators ────────────────────────────────
  requestToJoin(itineraryId: string): Observable<Collaborator> {
    return this.http.post<Collaborator>(`${this.api}/${itineraryId}/collaborators/request`, {});
  }

  invite(itineraryId: string, targetUserId: number, role: CollaboratorRole): Observable<Collaborator> {
    return this.http.post<Collaborator>(
      `${this.api}/${itineraryId}/collaborators/invite?targetUserId=${targetUserId}&role=${role}`, {}
    );
  }

  getCollaborators(itineraryId: string): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.api}/${itineraryId}/collaborators`);
  }

  getPendingRequests(itineraryId: string): Observable<Collaborator[]> {
    return this.http.get<Collaborator[]>(`${this.api}/${itineraryId}/collaborators/pending`);
  }

  approveRequest(itineraryId: string, collaboratorId: string): Observable<Collaborator> {
    return this.http.patch<Collaborator>(
      `${this.api}/${itineraryId}/collaborators/${collaboratorId}/approve`, {}
    );
  }

  rejectRequest(itineraryId: string, collaboratorId: string): Observable<Collaborator> {
    return this.http.patch<Collaborator>(
      `${this.api}/${itineraryId}/collaborators/${collaboratorId}/reject`, {}
    );
  }

  removeCollaborator(itineraryId: string, collaboratorId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${itineraryId}/collaborators/${collaboratorId}`);
  }

  // ─── Steps ────────────────────────────────────────
  addStep(itineraryId: string, request: ItineraryStepRequest): Observable<ItineraryStep> {
    return this.http.post<ItineraryStep>(`${this.api}/${itineraryId}/steps`, request);
  }

  getSteps(itineraryId: string): Observable<ItineraryStep[]> {
    return this.http.get<ItineraryStep[]>(`${this.api}/${itineraryId}/steps`);
  }

  updateStep(itineraryId: string, stepId: string, request: ItineraryStepRequest): Observable<ItineraryStep> {
    return this.http.put<ItineraryStep>(`${this.api}/${itineraryId}/steps/${stepId}`, request);
  }

  deleteStep(itineraryId: string, stepId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${itineraryId}/steps/${stepId}`);
  }

  // ─── Expenses ─────────────────────────────────────
  addExpense(itineraryId: string, request: ExpenseRequest): Observable<Expense> {
    return this.http.post<Expense>(`${this.api}/${itineraryId}/expenses`, request);
  }

  getExpenses(itineraryId: string): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.api}/${itineraryId}/expenses`);
  }

  updateExpense(itineraryId: string, expenseId: string, request: ExpenseRequest): Observable<Expense> {
    return this.http.put<Expense>(`${this.api}/${itineraryId}/expenses/${expenseId}`, request);
  }

  deleteExpense(itineraryId: string, expenseId: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${itineraryId}/expenses/${expenseId}`);
  }

  // ─── Settlement ───────────────────────────────────
  computeSettlement(itineraryId: string): Observable<SettlementSummary[]> {
    return this.http.post<SettlementSummary[]>(`${this.api}/${itineraryId}/settlement/compute`, {});
  }

  getSettlement(itineraryId: string): Observable<SettlementSummary[]> {
    return this.http.get<SettlementSummary[]>(`${this.api}/${itineraryId}/settlement`);
  }

  markSettlementPaid(itineraryId: string, settlementId: string): Observable<SettlementItem> {
    return this.http.patch<SettlementItem>(
      `${this.api}/${itineraryId}/settlement/${settlementId}/paid`, {}
    );
  }
}