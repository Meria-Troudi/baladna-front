import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MarketplaceApiService } from '../../../marketplace/services/marketplace-api.service';
import { MarketplaceCategory, MarketplaceProduct, MarketplaceProductUpsertRequest } from '../../../marketplace/models/marketplace.models';
import { UserService } from '../../../user/user.service';

@Component({
  selector: 'app-artisan-products',
  templateUrl: './artisan-products.component.html',
  styleUrls: ['./artisan-products.component.css']
})
export class ArtisanProductsComponent implements OnInit {
  isModalOpen = false;
  editingProductId: number | null = null;
  imagePreview: string | null = null;
  products: MarketplaceProduct[] = [];
  categories: MarketplaceCategory[] = [];
  artisanId: number | null = null;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  readonly productForm;

  constructor(
    private readonly fb: FormBuilder,
    private readonly marketplaceApi: MarketplaceApiService,
    private readonly userService: UserService
  ) {
    this.productForm = this.fb.group({
      nomProduit: ['', [Validators.required]],
      descriptionProduit: ['', [Validators.required]],
      prixProduit: [0, [Validators.required, Validators.min(0.01)]],
      imageProduit: ['', [Validators.required]],
      idCategorie: [null as number | null, [Validators.required]],
      stockProduit: [1, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.userService.getMyProfile().subscribe({
      next: (user: any) => {
        this.artisanId = Number(user.id || user.idUtilisateur || null);
        this.loadProducts();
      },
      error: () => (this.errorMessage = 'Unable to load artisan profile.')
    });
    this.marketplaceApi.getAllCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: () => (this.categories = [])
    });




     // Cloudinary direct
  setTimeout(() => {
    const btn = document.getElementById('cloudinary-btn');
    if (btn) {
      btn.onclick = () => {
        console.log('🔥 Bouton Cloudinary cliqué !');
        const cloudinary = (window as any).cloudinary;
        cloudinary.createUploadWidget(
          {
            cloudName: 'dwsacemju',
            uploadPreset: 'baladna_preset',
            sources: ['local'],
            maxFiles: 1
          },
          (error: any, result: any) => {
            if (result?.event === 'success') {
              const url = result.info.secure_url;
              this.imagePreview = url;
              this.productForm.patchValue({ imageProduit: url });
              const img = document.getElementById('preview-img') as HTMLImageElement;
              if (img) { img.src = url; img.style.display = 'block'; }
              console.log('✅', url);
            }
          }
        ).open();
      };
      console.log('✅ Bouton Cloudinary attaché');
    } else {
      console.error('❌ Bouton Cloudinary non trouvé');
    }
  }, 500);



















  }

  get artisanProducts(): MarketplaceProduct[] {
    if (!this.artisanId) return [];
    return this.products.filter(p => Number(p.idArtisan) === this.artisanId);
  }

  openCreateModal(): void {
    this.isModalOpen = true;
    this.editingProductId = null;
    this.imagePreview = null;
    this.productForm.reset({
      nomProduit: '', descriptionProduit: '', prixProduit: 0,
      imageProduit: '', idCategorie: null, stockProduit: 0
    });
  }

  editProduct(product: MarketplaceProduct): void {
    this.isModalOpen = true;
    this.editingProductId = product.idProduit;
    this.imagePreview = product.imageProduit ?? null;
    this.productForm.patchValue({
      nomProduit: product.nomProduit,
      descriptionProduit: product.descriptionProduit ?? '',
      prixProduit: Number(product.prixProduit),
      imageProduit: product.imageProduit ?? '',
      idCategorie: product.idCategorie ?? null,
      stockProduit: Number(product.stockProduit)
    });
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.isSubmitting = false;
    this.imagePreview = null;
    this.editingProductId = null;
    this.productForm.reset({
      nomProduit: '', descriptionProduit: '', prixProduit: 0,
      imageProduit: '', idCategorie: null, stockProduit: 0
    });
  }

  // ========== UPLOAD CLOUDINARY ==========
  startCloudinaryUpload(): void {
    console.log('🔥 startCloudinaryUpload appelé !');

    const cloudinary = (window as any).cloudinary;
    if (!cloudinary) {
      alert('Cloudinary not loaded. Refresh the page.');
      return;
    }

    cloudinary.createUploadWidget(
      {
        cloudName: 'dwsacemju',
        uploadPreset: 'baladna_preset',
        sources: ['local', 'url', 'camera'],
        maxFiles: 1,
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
        maxFileSize: 5000000
      },
      (error: any, result: any) => {
        if (result?.event === 'success') {
          const url = result.info.secure_url;
          this.imagePreview = url;
          this.productForm.patchValue({ imageProduit: url });
          console.log('✅ Cloudinary URL:', url);
        }
        if (error) {
          console.error('Cloudinary error:', error);
        }
      }
    ).open();
  }

  removeImage(): void {
    this.imagePreview = null;
    this.productForm.patchValue({ imageProduit: '' });
  }

  submitProduct(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (!this.artisanId) {
      this.errorMessage = 'Missing artisan id.';
      return;
    }
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const value = this.productForm.getRawValue();
    const payload: MarketplaceProductUpsertRequest = {
      nomProduit: value.nomProduit ?? '',
      descriptionProduit: value.descriptionProduit ?? '',
      prixProduit: Number(value.prixProduit || 0),
      imageProduit: value.imageProduit ?? '',
      idCategorie: value.idCategorie ?? null,
      stockProduit: Number(value.stockProduit || 0),
      idArtisan: this.artisanId
    };

    const request$ = this.editingProductId
      ? this.marketplaceApi.updateProduct(this.editingProductId, payload, this.artisanId)
      : this.marketplaceApi.createProduct(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeModal();
        this.loadProducts();
        this.successMessage = this.editingProductId ? 'Updated!' : 'Created!';
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Submit error:', err);
        this.errorMessage = 'Submission failed.';
      }
    });
  }

  deleteProduct(product: MarketplaceProduct): void {
    if (!this.artisanId) return;
    if (confirm('Delete this product?')) {
      this.marketplaceApi.deleteProduct(product.idProduit, this.artisanId).subscribe({
        next: () => {
          this.loadProducts();
          this.successMessage = 'Deleted!';
        },
        error: (err) => {
          console.error('Delete error:', err);
          this.errorMessage = 'Delete failed.';
        }
      });
    }
  }

  private loadProducts(): void {
    if (!this.artisanId) return;
    this.marketplaceApi.getProductsByArtisan(this.artisanId).subscribe({
      next: (products) => (this.products = products),
      error: (err) => {
        console.error('Load error:', err);
        this.errorMessage = 'Unable to load products.';
      }
    });
  }
}