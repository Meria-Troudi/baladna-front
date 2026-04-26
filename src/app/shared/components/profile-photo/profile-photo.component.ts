import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UserService } from '../../../features/user/user.service';

@Component({
  selector: 'app-profile-photo',
  templateUrl: './profile-photo.component.html',
  styleUrl: './profile-photo.component.css'
})
export class ProfilePhotoComponent implements OnInit {
   @Input() photoPath: string | null = null;
  @Input() firstName: string = '';
  @Input() lastName: string = '';
  @Input() size: number = 100;
 @Output() photoUpdated = new EventEmitter<string | null>();

  photoUrl: string = '';
  loading = false;
  error = '';
  success = '';
  showMenu = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.updatePhotoUrl();
  }

  ngOnChanges(): void {
    this.updatePhotoUrl();
  }

  updatePhotoUrl(): void {
    this.photoUrl = this.userService.getPhotoUrl(this.photoPath);
  }

  get initials(): string {
    return `${this.firstName?.charAt(0) || ''}${this.lastName?.charAt(0) || ''}`;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    // Vérification côté client
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      this.error = 'Format invalide — JPG ou PNG uniquement';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.error = 'Photo trop grande — maximum 5MB';
      return;
    }

    this.uploadPhoto(file);
  }

  uploadPhoto(file: File): void {
    this.loading = true;
    this.error = '';
    this.success = '';

    this.userService.uploadPhoto(file).subscribe({
      next: (fileName) => {
        this.loading = false;
        this.photoPath = fileName;
        this.updatePhotoUrl();
        this.success = 'Photo mise à jour !';
        this.photoUpdated.emit(fileName);
        this.showMenu = false;
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error || 'Erreur lors de l\'upload';
      }
    });
  }

  deletePhoto(): void {
    if (!confirm('Supprimer votre photo de profil ?')) return;

    this.loading = true;
    this.userService.deletePhoto().subscribe({
      next: () => {
        this.loading = false;
        this.photoPath = null;
        this.updatePhotoUrl();
        this.success = 'Photo supprimée';
        this.photoUpdated.emit(null);
        this.showMenu = false;
        setTimeout(() => this.success = '', 3000);
      },
      error: () => {
        this.loading = false;
        this.error = 'Erreur lors de la suppression';
      }
    });
  }

}
