import { Component, Output, EventEmitter, OnChanges, SimpleChanges, Input } from '@angular/core';
import { Event } from '../../../models/event.model';
import { ReservationService, Reservation } from '../../../services/reservation.service';

 
@Component({
  selector: 'app-reservation-form',
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css']
})
export class ReservationFormComponent implements OnChanges {
  @Input() userId!: number;
  @Input() event: Event | null = null;
  @Input() editMode: boolean = false;
  @Input() reservation: Reservation | null = null;
  @Output() reserved = new EventEmitter<Reservation>();
  @Output() updated = new EventEmitter<Reservation>();
  @Output() close = new EventEmitter<void>();

  personsCount = 1;
  loading = false;
  error = '';
  success = '';

  constructor(private reservationService: ReservationService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reservation'] && this.reservation && this.editMode) {
      this.personsCount = this.reservation.personsCount;
      console.log('Edit mode: Pre-filled persons count:', this.personsCount);
      console.log('Reservation event data:', this.event);

      if (!this.event && this.reservation.event) {
        this.event = this.reservation.event;
        console.log('Using reservation.event:', this.event);
      }
    }

    if (changes['event']) {
      console.log('Event input changed:', this.event);
    }
  }

  get totalPrice(): number {
    return (this.event?.price || 0) * this.personsCount;
  }

  submit(): void {
    if (this.personsCount < 1 || this.personsCount > 10) {
      this.error = 'Number of persons must be between 1 and 10';
      return;
    }

    if (!this.event?.id) {
      this.error = 'Event information is missing. Please try again.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    if (this.editMode && this.reservation) {
      this.reservationService.update(this.event.id, this.reservation.id, this.personsCount).subscribe({
        next: (updatedReservation) => {
          this.success = 'Reservation updated successfully!';

          setTimeout(() => {
            this.updated.emit(updatedReservation);
          }, 1000);
        },
        error: (err) => {
          this.error = err.error?.message || 'Update failed. Please try again.';
          this.loading = false;
          console.error('Update error:', err);
        }
      });
    } else {
      this.reservationService.create(this.event.id, this.personsCount).subscribe({
        next: (reservation) => {
          this.success =
            reservation.status === 'CONFIRMED'
              ? 'Reservation confirmed! QR code will be displayed.'
              : 'You have been added to the waitlist.';

          setTimeout(() => {
            this.reserved.emit(reservation);
          }, 1000);
        },
        error: (err) => {
          this.error = 'Reservation failed. Please try again.';
          this.loading = false;
          console.error('Reservation error:', err);
        }
      });
    }
  }
}