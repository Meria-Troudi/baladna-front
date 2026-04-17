import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { StepCategoryComponent } from '../../../host/components/event-form/steps/step-category/step-category.component';
import { StepDetailsComponent } from '../../../host/components/event-form/steps/step-details/step-details.component';
import { StepMediaComponent } from '../../../host/components/event-form/steps/step-media/step-media.component';

export interface EventMedia {
  eventId: string;
  url: string;
  type: 'IMAGE' | 'VIDEO';
  isCover: boolean;
  orderIndex: number;
}

@Component({
  selector: 'app-admin-event-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StepCategoryComponent,
    StepDetailsComponent,
    StepMediaComponent
  ],
  templateUrl: './admin-event-form.component.html',
  styleUrls: ['./admin-event-form.component.css']
})
export class AdminEventFormComponent implements OnInit {
  eventForm!: FormGroup;
  step = 1;
  isEdit = false;
  loading = false;
  eventId: string | null = null;

  // Media handling
  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  mediaItems: EventMedia[] = [];
  coverIndex = -1;

  // Categories - fetched from backend
  categories: string[] = [];
  categoriesLoading = false;

  // Admin-specific: View host info
  hostInfo: { id: number; name: string; email: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();

    // Check if edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.eventId = id;
      this.loadEvent(id);
    }
  }

  loadCategories(): void {
    this.categoriesLoading = true;
    this.eventService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.categoriesLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading categories:', err);
        // Fallback to default categories if backend fails
        this.categories = ['CULTURAL', 'SPORT', 'ENTERTAINMENT', 'EDUCATIONAL', 'MUSIC', 'ART', 'FOOD', 'OTHER'];
        this.categoriesLoading = false;
      }
    });
  }

  initForm(): void {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      category: ['', Validators.required],
      startAt: ['', Validators.required],
      endAt: ['', Validators.required],
      location: ['', Validators.required],
      capacity: [null, [Validators.required, Validators.min(1)]],
      price: [0, [Validators.min(0)]]
    });
  }

  loadEvent(id: string): void {
    this.eventService.getEventById(id).subscribe({
      next: (event) => {
        this.eventForm.patchValue({
          title: event.title,
          description: event.description,
          category: event.category,
          startAt: event.startAt ? this.formatDateTimeLocal(event.startAt) : '',
          endAt: event.endAt ? this.formatDateTimeLocal(event.endAt) : '',
          location: event.location,
          capacity: event.capacity,
          price: event.price || 0
        });

        // Load host info
        if (event.createdByUserId) {
          this.hostInfo = {
            id: event.createdByUserId,
            name: `Host #${event.createdByUserId}`,
            email: '' // Would need to fetch from user service
          };
        }

        // Load existing media
        if (event.media && event.media.length > 0) {
          this.mediaItems = event.media.map((m: any, index: number) => ({
            eventId: m.eventId || String(id),
            url: m.url,
            type: m.type || 'IMAGE',
            isCover: m.isCover || false,
            orderIndex: m.orderIndex || index
          }));
          this.coverIndex = this.mediaItems.findIndex(m => m.isCover);
        }
      },
      error: (err: any) => {
        console.error('Error loading event:', err);
        alert('Failed to load event data');
        this.router.navigate(['/admin/events']);
      }
    });
  }

  formatDateTimeLocal(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // Step navigation
  next(): void {
    if (this.step === 1 && !this.eventForm.value.category) return;
    if (this.step === 2 && this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }
    if (this.step < 3) {
      this.step++;
    }
  }

  prev(): void {
    if (this.step > 1) {
      this.step--;
    }
  }

  goToStep(stepNum: number): void {
    // Allow going back to previous steps
    if (stepNum < this.step) {
      this.step = stepNum;
    }
  }

  // Category selection
  selectCategory(category: string): void {
    this.eventForm.patchValue({ category });
  }

  // File handling with size validation
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      
      // File size limits (in bytes)
      const IMAGE_MAX_SIZE = 5 * 1024 * 1024; // 5 MB
      const VIDEO_MAX_SIZE = 20 * 1024 * 1024; // 20 MB
      
      for (const file of files) {
        // Validate file size
        if (file.type.startsWith('image/') && file.size > IMAGE_MAX_SIZE) {
          alert(`Image "${file.name}" is too large. Maximum size is 5 MB.`);
          continue;
        }
        if (file.type.startsWith('video/') && file.size > VIDEO_MAX_SIZE) {
          alert(`Video "${file.name}" is too large. Maximum size is 20 MB.`);
          continue;
        }
        
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          this.selectedFiles.push(file);
          
          const reader = new FileReader();
          reader.onload = () => {
            this.previewUrls.push(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
    // Reset input
    input.value = '';
  }

  removeFile(index: number): void {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
      this.previewUrls.splice(index, 1);
    }
  }

  setCover(index: number): void {
    this.coverIndex = index;
  }

  moveFile(from: number, to: number): void {
    if (to < 0 || to >= this.previewUrls.length) return;
    
    const file = this.selectedFiles[from];
    const url = this.previewUrls[from];
    
    this.selectedFiles.splice(from, 1);
    this.previewUrls.splice(from, 1);
    
    this.selectedFiles.splice(to, 0, file);
    this.previewUrls.splice(to, 0, url);
    
    if (this.coverIndex === from) {
      this.coverIndex = to;
    } else if (this.coverIndex === to) {
      this.coverIndex = from;
    }
  }

  // Submit
  submit(): void {
    if (this.eventForm.invalid) {
      this.eventForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = this.eventForm.value;

    const payload = {
      ...formData,
      startAt: new Date(formData.startAt).toISOString(),
      endAt: new Date(formData.endAt).toISOString(),
      price: Number(formData.price) || 0
      // Note: We do NOT include createdByUserId - admin cannot change host
    };

    if (this.isEdit && this.eventId) {
      // Update existing event
      this.eventService.updateEvent(this.eventId, payload).subscribe({
        next: (updatedEvent) => {
          // Handle media upload after event update
          this.handleMediaUpload(String(updatedEvent.id || this.eventId));
        },
        error: (err: any) => {
          this.loading = false;
          console.error('Error updating event:', err);
          alert('Failed to update event');
        }
      });
    } else {
      // Create new event - admin must specify a host
      // For now, we'll use a default or prompt for host
      const hostId = prompt('Enter Host ID for the event:');
      if (!hostId) {
        this.loading = false;
        return;
      }
      
      payload.createdByUserId = Number(hostId);
      
      this.eventService.createEvent(payload).subscribe({
        next: (newEvent) => {
          // Handle media upload after event creation
          this.handleMediaUpload(String(newEvent.id));
        },
        error: (err: any) => {
          this.loading = false;
          console.error('Error creating event:', err);
          alert('Failed to create event');
        }
      });
    }
  }

  handleMediaUpload(eventId: string): void {
    // Upload new files if any
    if (this.selectedFiles.length > 0) {
      this.uploadMedia(eventId);
    } else if (this.mediaItems.length > 0) {
      // Update existing media order/cover
      this.updateMediaOrder(eventId);
    } else {
      this.finish();
    }
  }

  uploadMedia(eventId: string): void {
    const formData = new FormData();
    
    this.selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    // Send cover index and order
    formData.append('coverIndex', this.coverIndex.toString());
    formData.append('order', JSON.stringify(this.previewUrls.map((_, i) => i)));

    // Use the event service upload method
    this.eventService.uploadEventMedia(eventId, formData).subscribe({
      next: () => {
        this.finish();
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error uploading media:', err);
        alert('Event saved but media upload failed. You can add media later from the event details.');
        this.finish();
      }
    });
  }

  updateMediaOrder(eventId: string): void {
    // Update media order and cover
    const mediaUpdates = this.mediaItems.map((item, index) => ({
      ...item,
      orderIndex: index,
      isCover: index === this.coverIndex
    }));

    // Use the event service update media method
    this.eventService.updateEventMediaOrder(eventId, mediaUpdates).subscribe({
      next: () => {
        this.finish();
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error updating media order:', err);
        this.finish();
      }
    });
  }

  finish(): void {
    this.loading = false;
    // Navigate back to admin events list
    this.router.navigate(['/admin/events']);
  }

  // Getters
  get f() { return this.eventForm.controls; }
  get isStep1Valid(): boolean { return !!this.eventForm.value.category; }
  get isStep2Valid(): boolean { return this.eventForm.valid; }
}