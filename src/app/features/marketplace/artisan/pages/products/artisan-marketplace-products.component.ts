import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import QRCode from 'qrcode';
import { finalize } from 'rxjs/operators';
import { MarketplaceCategory, MarketplaceProduct, MarketplaceProductUpsertRequest } from '../../../models/marketplace.models';
import { MarketplaceApiService } from '../../../services/marketplace-api.service';
import { UserService } from '../../../../user/user.service';

@Component({
  selector: 'app-artisan-marketplace-products',
  templateUrl: './artisan-marketplace-products.component.html',
  styleUrls: ['./artisan-marketplace-products.component.css'],
})
export class ArtisanMarketplaceProductsComponent implements OnInit {
  products: MarketplaceProduct[] = [];
  categories: MarketplaceCategory[] = [];
  isLoading = true;
  isSaving = false;
  selectedProductId: number | null = null;
  isModalOpen = false;
  imagePreview = '';
  qrCodeDataUrl = '';
  feedback = '';
  isError = false;
  artisanId: number | null = null;

  readonly productForm;

  constructor(
    private readonly marketplaceApi: MarketplaceApiService,
    private readonly fb: FormBuilder,
    private readonly userService: UserService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.productForm = this.fb.group({
      nomProduit: ['', [Validators.required, Validators.maxLength(200)]],
      descriptionProduit: [''],
      imageProduit: [''],
      prixProduit: [0, [Validators.required, Validators.min(0.01)]],
      stockProduit: [0, [Validators.required, Validators.min(0)]],
      idCategorie: [null as number | null],
    });
  }

ngOnInit(): void {
  this.userService.getMyNumericUserId().subscribe({
    next: (id) => {
      this.artisanId = id;
      if (id == null) {
        this.isLoading = false;
        this.showFeedback('Unable to resolve your account. Please sign in again.', true);
        return;
      }
      this.loadProducts();
    },
  });
  this.marketplaceApi.getAllCategories().subscribe({
    next: (categories) => (this.categories = categories),
    error: () => (this.categories = []),
  });
  this.productForm.valueChanges.subscribe(() => this.generateQrPreview());

  // 🔄 Écouter les changements IA pour rafraîchir automatiquement
  window.addEventListener('baladna-data-changed', (event: any) => {
    console.log('🔄 AI action detected:', event.detail.action);
    this.loadProducts();
    this.showFeedback('✅ Product list updated from AI assistant!');
  });
}

  get filteredProducts(): MarketplaceProduct[] {
    return this.products;
  }

  get totalStock(): number {
    return this.filteredProducts.reduce((sum, p) => sum + p.stockProduit, 0);
  }

  submitForm(): void {
    if (!this.artisanId) {
      this.showFeedback('Missing artisan id. Please reconnect.', true);
      return;
    }
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    this.feedback = '';
    const values = this.productForm.getRawValue();
    const payload: MarketplaceProductUpsertRequest = {
      nomProduit: values.nomProduit ?? '',
      descriptionProduit: values.descriptionProduit ?? '',
      imageProduit: values.imageProduit ?? '',
      prixProduit: Number(values.prixProduit ?? 0),
      stockProduit: Number(values.stockProduit ?? 0),
      idCategorie: values.idCategorie ?? null,
      idArtisan: this.artisanId,
    };

    const request$ = this.selectedProductId
      ? this.marketplaceApi.updateProduct(this.selectedProductId, payload, this.artisanId)
      : this.marketplaceApi.createProduct(payload);

    request$.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: () => {
        this.showFeedback(this.selectedProductId ? 'Product updated.' : 'Product created.');
        this.resetForm();
        this.isModalOpen = false;
        this.loadProducts();
      },
      error: () => this.showFeedback('Unable to save product. Please retry.', true),
    });
  }

  editProduct(product: MarketplaceProduct): void {
    console.log('EDIT CLICK', product);
    this.isModalOpen = true;
    this.selectedProductId = product.idProduit;
    this.imagePreview = product.imageProduit ?? '';
    this.productForm.patchValue({
      nomProduit: product.nomProduit,
      descriptionProduit: product.descriptionProduit ?? '',
      imageProduit: product.imageProduit ?? '',
      prixProduit: product.prixProduit,
      stockProduit: product.stockProduit,
      idCategorie: product.idCategorie ?? null,
    });
    this.generateQrPreview();
    this.cdr.detectChanges();
  }

  deleteProduct(productId: number): void {
    if (!this.artisanId) {
      this.showFeedback('Artisan ID missing.', true);
      return;
    }
    
    if (confirm('Are you sure you want to delete this product?')) {
      this.marketplaceApi.deleteProduct(productId, this.artisanId).subscribe({
        next: () => {
          this.showFeedback('Product deleted successfully.');
          this.loadProducts();
        },
        error: () => this.showFeedback('Delete failed.', true),
      });
    }
  }

  resetForm(): void {
    this.selectedProductId = null;
    this.imagePreview = '';
    this.qrCodeDataUrl = '';
    this.productForm.reset({
      nomProduit: '',
      descriptionProduit: '',
      imageProduit: '',
      prixProduit: 0,
      stockProduit: 0,
      idCategorie: null,
    });
  }

  openCreateModal(): void {
    this.resetForm();
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

onImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  console.log('🔥 Uploading to Cloudinary:', file.name);

  // Aperçu local rapide
  const reader = new FileReader();
  reader.onload = () => {
    this.imagePreview = String(reader.result || '');
  };
  reader.readAsDataURL(file);

  // Upload vers Cloudinary via backend
  const formData = new FormData();
  formData.append('file', file);

  fetch('http://localhost:8081/products/upload-image', {
    method: 'POST',
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      console.log('✅ Cloudinary URL:', data.url);
      this.imagePreview = data.url;
      this.productForm.patchValue({ imageProduit: data.url });
      this.generateQrPreview();
    })
    .catch(err => {
      console.error('❌ Upload error:', err);
      this.showFeedback('Image upload failed.', true);
    });
}

  private loadProducts(): void {
    if (!this.artisanId) {
      this.products = [];
      return;
    }
    this.isLoading = true;
    this.marketplaceApi.getProductsByArtisan(this.artisanId).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
      },
      error: () => {
        this.products = [];
        this.isLoading = false;
      },
    });
  }

  private showFeedback(message: string, isError = false): void {
    this.feedback = message;
    this.isError = isError;
  }

closeModal(): void {
  this.resetForm();
  this.isModalOpen = false;
  this.feedback = '';
  this.isError = false;
}







async generateQrPreview(): Promise<void> {
  const values = this.productForm.getRawValue();
  const name = (values.nomProduit || '').trim();
  const qrText = this.selectedProductId != null
    ? `PRODUCT_ID:${this.selectedProductId}${name ? `|${name}` : ''}`
    : name;
  if (!qrText) {
    this.qrCodeDataUrl = '';
    return;
  }
  try {
    this.qrCodeDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 200 });
  } catch {
    this.qrCodeDataUrl = '';
  }
}


getCategoryName(idCategorie?: number | null): string {
  if (!idCategorie) return 'handicraft';
  const cat = this.categories.find(c => c.idCategorie === idCategorie);
  return cat?.nomCategorie || 'handicraft';
}

generateVideo(product: MarketplaceProduct): void {
  this.showFeedback('🎬 Generating your video... This may take 30 seconds.');

  // Fetch the image from its URL
  fetch(product.imageProduit || '')
    .then(res => res.blob())
    .then(blob => {
      const formData = new FormData();
      formData.append('file', blob, 'product.jpg');
      formData.append('productName', product.nomProduit);
      formData.append('price', product.prixProduit.toString());
      formData.append('category', this.getCategoryName(product.idCategorie));

      return fetch('http://localhost:8001/generate-video', {
        method: 'POST',
        body: formData
      });
    })
    .then(res => {
      if (!res.ok) throw new Error('Video generation failed');
      return res.blob();
    })
    .then(blob => {
      // Download video
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${product.nomProduit.replace(/\s+/g, '_')}_showcase.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showFeedback('✅ Video generated successfully!');
    })
    .catch(err => {
      console.error('Video error:', err);
      this.showFeedback('❌ Failed to generate video.', true);
    });
}
  
}