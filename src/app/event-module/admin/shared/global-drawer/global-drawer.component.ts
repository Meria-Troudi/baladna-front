import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-global-drawer',
  templateUrl: './global-drawer.component.html',
  styleUrls: ['./global-drawer.component.css']
})
export class GlobalDrawerComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() status?: string;
  @Input() footer = false;
  @Input() selectedEntity: any = null;

  @Output() close = new EventEmitter<void>();

  // Computed properties
  drawerTitle = '';
  drawerStatus = '';

  ngOnChanges() {
    this.updateTitleAndStatus();
  }

  private updateTitleAndStatus(): void {
    if (!this.selectedEntity) {
      this.drawerTitle = this.title;
      this.drawerStatus = this.status || '';
      return;
    }

    switch (this.selectedEntity.type) {
      case 'event':
        this.drawerTitle = this.selectedEntity.data.title || '';
        this.drawerStatus = this.selectedEntity.data.status || '';
        break;
      case 'booking':
        this.drawerTitle = `Booking #${this.selectedEntity.data.id || ''}`;
        this.drawerStatus = this.selectedEntity.data.status || '';
        break;
      case 'review':
        this.drawerTitle = 'Review';
        this.drawerStatus = `${this.selectedEntity.data.rating || 0} Stars`;
        break;
      default:
        this.drawerTitle = this.title;
        this.drawerStatus = this.status || '';
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}