import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ItineraryService } from '../../services/itinerary.service';
import { finalize } from 'rxjs/operators';

import {
  Itinerary, ItineraryStep, Collaborator,
  Expense, SettlementSummary
} from '../../models/itinerary.model';
import { UserService } from '../../../user/user.service';

@Component({
  selector: 'app-itinerary-detail',
  templateUrl: './itinerary-detail.component.html',
  styleUrls: ['./itinerary-detail.component.scss']
})
export class ItineraryDetailComponent implements OnInit {

  @ViewChild('confirmationModal') confirmationModal: any;

  itinerary: Itinerary | null = null;
  steps: ItineraryStep[] = [];
  collaborators: Collaborator[] = [];
  pendingRequests: Collaborator[] = [];
  expenses: Expense[] = [];
  settlement: SettlementSummary[] = [];

  activeTab: 'steps' | 'collaborators' | 'expenses' | 'settlement' = 'steps';
  loading = false;
  error = '';
  successMessage = '';

  // Step form
  showStepForm = false;
  stepForm: FormGroup;
  editingStepId: string | null = null;
  stepLoading = false;

  // ── SERVICE PICKER (new) ──────────────────────────
  showServicePicker = false;
  servicePickerLoading = false;
  availableServices: any[] = [];
  filteredServices: any[] = [];
  selectedService: any = null;
  serviceSearchQuery = '';
  // ─────────────────────────────────────────────────

  // Expense form
  showExpenseForm = false;
  expenseForm: FormGroup;
  editingExpenseId: string | null = null;
  expenseLoading = false;

  settlementLoading = false;
  itineraryId!: string;
  currentUserId: number = 0;
  currentUserName: string = '';
  
  // ✅ Track which settlements are being processed to prevent double-clicks
  private processingSettlements: Set<string> = new Set();

  // User cache for displaying names
  private userCache: Map<number, { firstName: string; lastName: string }> = new Map();

  private apiBase = 'http://localhost:8081/api';
  private deleteExpenseCallback: (() => void) | null = null;
  private collaboratorIdToRemove: string | null = null;
  private stepIdToDelete: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private itineraryService: ItineraryService,
    private userService: UserService,
    private cdr: ChangeDetectorRef  // ✅ Inject for manual change detection
  ) {
    this.stepForm = this.fb.group({
      serviceType: ['EVENT', Validators.required],
      serviceRefId: ['', Validators.required],
      title: ['', Validators.required],
      notes: [''],
      plannedDate: [''],
      estimatedCost: [null],
      latitude: [null],
      longitude: [null]
    });

    this.expenseForm = this.fb.group({
      category: ['OTHER', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: [''],
      expenseDate: [new Date().toISOString().substring(0, 16), Validators.required]
    });
  }

  ngOnInit(): void {
    this.itineraryId = this.route.snapshot.paramMap.get('id')!;
    
    // Fetch current user ID from backend (more reliable than localStorage)
    this.userService.getMyProfile().subscribe({
      next: (user) => {
        this.currentUserId = user.id;
        this.currentUserName = `${user.firstName} ${user.lastName}`.trim() || user.email;
        console.log('✅ Current User ID fetched from backend:', this.currentUserId);
        this.loadAll();
      },
      error: () => {
        console.warn('⚠️ Could not fetch current user from backend');
        // Fallback to localStorage if available
        const userStr = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;
        if (userStr) {
          this.currentUserId = +userStr;
          console.log('User ID set from localStorage:', this.currentUserId);
        }
        this.loadAll();
      }
    });

    // Reset picker when service type changes
    this.stepForm.get('serviceType')?.valueChanges.subscribe(() => {
      this.selectedService = null;
      this.stepForm.patchValue({ serviceRefId: '' }, { emitEvent: false });
      this.availableServices = [];
      this.filteredServices = [];
      this.serviceSearchQuery = '';
    });
  }

  // ─────────────────────────────────────────────────
  // LOAD ALL
  // ─────────────────────────────────────────────────

  loadAll(): void {
    this.loading = true;
    this.itineraryService.getById(this.itineraryId).subscribe({
      next: (itin) => {
        this.itinerary = itin;
        this.steps = itin.steps || [];
        this.collaborators = itin.collaborators || [];
        this.loading = false;
        this.loadExpenses();
        if (this.isOwner) this.loadPendingRequests();
      },
      error: () => { this.error = 'Could not load itinerary'; this.loading = false; }
    });
  }

  loadExpenses(): void {
    this.itineraryService.getExpenses(this.itineraryId).subscribe({
      next: (data) => this.expenses = data,
      error: () => {}
    });
  }

  loadPendingRequests(): void {
    this.itineraryService.getPendingRequests(this.itineraryId).subscribe({
      next: (data) => this.pendingRequests = data,
      error: () => {}
    });
  }

  get isOwner(): boolean {
    return this.itinerary?.ownerId === this.currentUserId;
  }

  get totalExpenses(): number {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }

  // ─────────────────────────────────────────────────
  // SERVICE PICKER METHODS (new)
  // ─────────────────────────────────────────────────

  openServicePicker(): void {
    this.showServicePicker = true;
    this.serviceSearchQuery = '';
    this.loadServices();
  }

  closeServicePicker(): void {
    this.showServicePicker = false;
  }

  loadServices(): void {
    const type = this.stepForm.get('serviceType')?.value;
    this.servicePickerLoading = true;
    this.availableServices = [];
    this.filteredServices = [];

    let url = '';
    if (type === 'EVENT') {
      url = `${this.apiBase}/events`;
    }
    // Uncomment when other modules are ready:
    // else if (type === 'TRANSPORT') { url = `${this.apiBase}/transport`; }
    // else if (type === 'ACCOMMODATION') { url = `${this.apiBase}/accommodations`; }

    if (!url) {
      this.servicePickerLoading = false;
      return;
    }

    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.availableServices = data;
        this.filteredServices = data;
        this.servicePickerLoading = false;
      },
      error: () => {
        this.servicePickerLoading = false;
        this.availableServices = [];
        this.filteredServices = [];
      }
    });
  }

  filterServices(): void {
    const q = this.serviceSearchQuery.toLowerCase().trim();
    if (!q) {
      this.filteredServices = [...this.availableServices];
      return;
    }
    this.filteredServices = this.availableServices.filter(s => {
      const name = (s.title || s.name || s.departurePoint || '').toLowerCase();
      const desc = (s.description || s.location || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }

  selectService(service: any): void {
    this.selectedService = service;
    const id = service.eventId || service.id;
    const title = service.title || service.name || service.departurePoint || 'Step';
    this.stepForm.patchValue({
      serviceRefId: String(id),
      title: this.stepForm.get('title')?.value || title
    });
    this.showServicePicker = false;
  }

  clearSelectedService(): void {
    this.selectedService = null;
    this.stepForm.patchValue({ serviceRefId: '' });
  }

  // Utility getters for service display
  getServiceId(service: any): string {
    return String(service?.eventId || service?.id || '');
  }

  getServiceName(service: any): string {
    return service?.title || service?.name || service?.departurePoint || 'Unknown';
  }

  getServiceDescription(service: any): string {
    return service?.description || service?.location || service?.arrivalPoint || '';
  }

  getServicePrice(service: any): number {
    return service?.price || service?.basePrice || service?.pricePerNight || 0;
  }

  getServiceDate(service: any): string {
    return service?.startAt || service?.departureDate || service?.checkIn || '';
  }

  getServiceLocation(service: any): string {
    return service?.location || service?.departurePoint || '';
  }

  isModuleReady(type: string): boolean {
    return type === 'EVENT'; // Only events ready, others coming soon
  }

  getServiceTypeLabel(type: string): string {
    const map: Record<string, string> = {
      'EVENT': 'Events',
      'TRANSPORT': 'Transport',
      'ACCOMMODATION': 'Accommodations'
    };
    return map[type] || type;
  }

  // ─────────────────────────────────────────────────
  // STEP CRUD
  // ─────────────────────────────────────────────────

  openStepForm(step?: ItineraryStep): void {
    this.showStepForm = true;
    this.selectedService = null;
    this.availableServices = [];
    this.filteredServices = [];
    this.serviceSearchQuery = '';
    this.showServicePicker = false;

    if (step) {
      this.editingStepId = step.id;
      this.stepForm.patchValue({
        serviceType: step.serviceType,
        serviceRefId: step.serviceRefId,
        title: step.title,
        notes: step.notes,
        plannedDate: step.plannedDate?.substring(0, 16),
        estimatedCost: step.estimatedCost,
        latitude: step.latitude,
        longitude: step.longitude
      });
    } else {
      this.editingStepId = null;
      this.stepForm.reset({ serviceType: 'EVENT' });
    }
  }

  closeStepForm(): void {
    this.showStepForm = false;
    this.showServicePicker = false;
    this.editingStepId = null;
    this.selectedService = null;
    this.stepForm.reset({ serviceType: 'EVENT' });
  }

  submitStep(): void {
    if (this.stepForm.invalid) return;
    this.stepLoading = true;

    const action = this.editingStepId
      ? this.itineraryService.updateStep(this.itineraryId, this.editingStepId, this.stepForm.value)
      : this.itineraryService.addStep(this.itineraryId, this.stepForm.value);

    action.subscribe({
      next: () => {
        this.stepLoading = false;
        this.closeStepForm();
        this.loadAll();
        this.showSuccess(this.editingStepId ? 'Step updated' : 'Step added');
      },
      error: () => { this.stepLoading = false; this.error = 'Failed to save step'; }
    });
  }

  deleteStep(stepId: string): void {
    this.stepIdToDelete = stepId;
    this.confirmationModal.show({
      title: 'Delete Step',
      message: 'Are you sure you want to delete this step? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true
    });
  }

  // ─────────────────────────────────────────────────
  // COLLABORATOR CRUD
  // ─────────────────────────────────────────────────

  approveRequest(collaboratorId: string): void {
    this.itineraryService.approveRequest(this.itineraryId, collaboratorId).subscribe({
      next: () => { this.loadAll(); this.showSuccess('Collaborator approved'); },
      error: () => this.error = 'Failed to approve request'
    });
  }

  rejectRequest(collaboratorId: string): void {
    this.itineraryService.rejectRequest(this.itineraryId, collaboratorId).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(c => c.id !== collaboratorId);
        this.showSuccess('Request rejected');
      },
      error: () => this.error = 'Failed to reject request'
    });
  }

  removeCollaborator(collaboratorId: string): void {
    this.collaboratorIdToRemove = collaboratorId;
    this.confirmationModal.show({
      title: 'Remove Collaborator',
      message: 'Are you sure you want to remove this collaborator?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      isDangerous: true
    });
  }

  // ─────────────────────────────────────────────────
  // EXPENSE CRUD
  // ─────────────────────────────────────────────────

  openExpenseForm(expense?: Expense): void {
    this.showExpenseForm = true;
    if (expense) {
      this.editingExpenseId = expense.id;
      this.expenseForm.patchValue({
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        expenseDate: expense.expenseDate?.substring(0, 16)
      });
    } else {
      this.editingExpenseId = null;
      this.expenseForm.reset({
        category: 'OTHER',
        expenseDate: new Date().toISOString().substring(0, 16)
      });
    }
  }

  closeExpenseForm(): void {
    this.showExpenseForm = false;
    this.editingExpenseId = null;
  }

  submitExpense(): void {
    if (this.expenseForm.invalid) return;
    this.expenseLoading = true;

    const action = this.editingExpenseId
      ? this.itineraryService.updateExpense(this.itineraryId, this.editingExpenseId, this.expenseForm.value)
      : this.itineraryService.addExpense(this.itineraryId, this.expenseForm.value);

    action.subscribe({
      next: () => {
        this.expenseLoading = false;
        this.closeExpenseForm();
        this.loadExpenses();
        this.showSuccess(this.editingExpenseId ? 'Expense updated' : 'Expense added');
      },
      error: () => { this.expenseLoading = false; this.error = 'Failed to save expense'; }
    });
  }

  deleteExpense(expenseId: string): void {
    if (!this.confirmationModal) {
      console.error('Confirmation modal not initialized');
      return;
    }

    this.deleteExpenseCallback = () => {
      this.itineraryService.deleteExpense(this.itineraryId, expenseId).subscribe({
        next: () => {
          this.loadExpenses();
          this.showSuccess('Expense deleted');
        },
        error: () => this.error = 'Failed to delete expense'
      });
    };

    this.confirmationModal.show({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDangerous: true
    });
  }

  onConfirmationConfirmed(): void {
    if (this.stepIdToDelete) {
      const stepId = this.stepIdToDelete;
      this.stepIdToDelete = null;
      this.itineraryService.deleteStep(this.itineraryId, stepId).subscribe({
        next: () => {
          this.steps = this.steps.filter(s => s.id !== stepId);
          this.showSuccess('Step deleted');
        },
        error: () => this.error = 'Failed to delete step'
      });
    } else if (this.deleteExpenseCallback) {
      this.deleteExpenseCallback();
      this.deleteExpenseCallback = null;
    } else if (this.collaboratorIdToRemove) {
      const collaboratorId = this.collaboratorIdToRemove;
      this.collaboratorIdToRemove = null;
      this.itineraryService.removeCollaborator(this.itineraryId, collaboratorId).subscribe({
        next: () => {
          this.collaborators = this.collaborators.filter(c => c.id !== collaboratorId);
          this.showSuccess('Collaborator removed');
        },
        error: () => this.error = 'Failed to remove collaborator'
      });
    }
  }

  onConfirmationCancelled(): void {
    this.stepIdToDelete = null;
    this.deleteExpenseCallback = null;
    this.collaboratorIdToRemove = null;
  }

  // ─────────────────────────────────────────────────
  // SETTLEMENT
  // ─────────────────────────────────────────────────

  computeSettlement(): void {
    console.log('📊 computeSettlement called');
    this.settlementLoading = true;
    this.itineraryService.computeSettlement(this.itineraryId).subscribe({
      next: (data) => {
        console.log('📊 Settlement data received:', data);
        data.forEach((s, idx) => {
          console.log(`📊 Settlement[${idx}]:`, s);
          s.owes?.forEach((ow, idx2) => {
            console.log(`   owes[${idx2}]:`, ow.id, 'Status:', ow.status, 'Debtor:', ow.debtorUserId);
          });
        });
        this.settlement = data;
        console.log('📊 this.settlement updated:', this.settlement);
        this.settlementLoading = false;
        this.activeTab = 'settlement';
      },
      error: (error) => { 
        console.error('❌ computeSettlement error:', error);
        this.settlementLoading = false; 
        this.error = 'Failed to compute settlement'; 
      }
    });
  }

  isDebtorUser(debtorUserId: any): boolean {
    const debtorId = typeof debtorUserId === 'string' ? parseInt(debtorUserId, 10) : debtorUserId;
    return debtorId === this.currentUserId;
  }

  markPaid(settlementId: string): void {
    // ✅ Prevent double-clicks
    if (this.processingSettlements.has(settlementId)) {
      console.warn('⚠️ Settlement already being processed:', settlementId);
      return;
    }
    
    this.processingSettlements.add(settlementId);
    console.log('🔵 markPaid called with settlementId:', settlementId);
    
    this.itineraryService.markSettlementPaid(this.itineraryId, settlementId).subscribe({
      next: (response) => { 
        console.log('✅ Mark paid successful:', response);
        
        // ✅ UPDATE UI IMMEDIATELY - Create new settlement array with updated status
        this.settlement = this.settlement.map(s => ({
          ...s,
          owes: s.owes.map(ow => 
            ow.id === settlementId 
              ? { ...ow, status: 'PAID', settledAt: response.settledAt }
              : ow
          )
        }));
        
        // ✅ FORCE Angular to detect the change immediately
        this.cdr.detectChanges();
        
        this.showSuccess('✅ Marked as paid! Click "Recompute" button to see new settlements after adding more expenses.');
        this.processingSettlements.delete(settlementId);
        
        // ⚠️ DO NOT auto-refresh here - let user click Recompute manually
        // This prevents frontend from showing new settlements before backend 
        // has finished recalculating based on new expenses
      },
      error: (error) => { 
        console.error('❌ Mark paid error:', error);
        this.error = 'Failed to mark as paid: ' + (error.message || JSON.stringify(error));
        this.processingSettlements.delete(settlementId);
      }
    });
  }

  // ─────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────

  editItinerary(): void {
    this.router.navigate(['/tourist/itineraries', this.itineraryId, 'edit']);
  }

  goBack(): void {
    this.router.navigate(['/tourist/itineraries']);
  }

  getServiceIcon(type: string): string {
    const icons: Record<string, string> = {
      'EVENT': '🎭', 'TRANSPORT': '🚌', 'ACCOMMODATION': '🏨'
    };
    return icons[type] || '📍';
  }

  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      'TRANSPORT': '🚌', 'ACCOMMODATION': '🏨',
      'FOOD': '🍽️', 'EVENT': '🎭', 'OTHER': '💰'
    };
    return icons[cat] || '💰';
  }

  getRoleBadge(role: string): string {
    const map: Record<string, string> = {
      'OWNER': 'badge-owner',
      'EDITOR': 'badge-editor',
      'VIEWER': 'badge-viewer'
    };
    return map[role] || '';
  }

  getUserName(userId: number): string {
    // Return cached name if available
    if (this.userCache.has(userId)) {
      const user = this.userCache.get(userId)!;
      return this.formatUserName(user.firstName, user.lastName);
    }
    
    // Fetch and cache user name
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.userCache.set(userId, { firstName: user.firstName, lastName: user.lastName });
      },
      error: () => {
        // If fetch fails, use a placeholder
      }
    });
    
    return `User ${userId}`;
  }

  private formatUserName(firstName: string, lastName: string): string {
    const name = `${firstName} ${lastName}`.trim();
    return name || 'Unknown User';
  }

  private showSuccess(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => this.successMessage = '', 3000);
  }
}