export type MarketplaceOrderStatus =
  | 'CREATED'
  | 'PENDING'
  | 'PAID'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | string;

export const STATUT_TIMELINE: MarketplaceOrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED',
];

export const STATUT_LABELS: Record<MarketplaceOrderStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédiée',
  IN_TRANSIT: 'En transit',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  CREATED: 'Créée',
  PAID: 'Payée',
};

// Backend DTO mirror (tn.esprit.spring.baladna.marketplace.dto.response.ProductResponse)
export interface MarketplaceProduct {
  idProduit: number;
  nomProduit: string;
  descriptionProduit?: string | null;
  imageProduit?: string | null;
  prixProduit: number;
  stockProduit: number;
  dateCreation?: string;
  updatedAt?: string;
  idCategorie?: number | null;
  idArtisan?: number | null;
  images?: string[];
}

// Backend DTO mirror (tn.esprit.spring.baladna.marketplace.dto.request.ProductRequest)
export interface MarketplaceProductUpsertRequest {
  nomProduit: string;
  descriptionProduit?: string;
  imageProduit?: string;
  prixProduit: number;
  stockProduit: number;
  idCategorie?: number | null;
  idArtisan: number;
}

// Backend entity currently returned by /categories (tn.esprit.spring.baladna.marketplace.entity.Categorie)
export interface MarketplaceCategory {
  idCategorie?: number;
  nomCategorie?: string;
}

// Backend DTO mirror (tn.esprit.spring.baladna.marketplace.dto.response.CartResponse)
export interface MarketplaceCart {
  idPanier: number;
  idUser: number;
  status?: string;
  dateCreation?: string;
  lastUpdated?: string;
  items: MarketplaceCartItem[];
  total: number;
}

export interface MarketplaceCartItem {
  idCartItem: number;
  idProduit: number;
  nomProduit: string;
  imageProduit?: string | null;
  quantite: number;
  prix: number;
  sousTotal: number;
}
export interface MarketplaceCartItem {
  idCartItem: number;
  idProduit: number;
  nomProduit: string;
  imageProduit?: string | null;
  quantite: number;
  prix: number;
  sousTotal: number;
}

// Backend DTO mirror (tn.esprit.spring.baladna.marketplace.dto.request.CartItemRequest)
export interface MarketplaceCartItemRequest {
  idUser: number;
  idProduit: number;
  quantite: number;
}

// Backend DTO mirror (tn.esprit.spring.baladna.marketplace.dto.request.CheckoutRequest)
export interface MarketplaceCheckoutRequest {
  userId: number;
  total?: number;
  paymentMethod?: string;
  cardNumber?: string;
  cardHolder?: string;
  expiryDate?: string;
  cvv?: string;
  adresseLivraison?: string;
  telephone?: string;
  nomClient?: string;
}

// Backend DTO mirror (tn.esprit.spring.baladna.marketplace.dto.response.OrderResponse)
export interface MarketplaceOrder {
  idCommande: number;
  idUser: number;
  total: number;
  statut: MarketplaceOrderStatus;
  dateCreation?: string;
  updatedAt?: string;
  lignes: MarketplaceOrderLine[];
  transactionId?: string;
  paymentMethod: string;
  nomClient: string;
  adresseLivraison: string;
  telephone: string;
}

// Payment Request DTO
export interface MarketplacePaymentRequest {
  idUser: number;
  amount: number;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolderName: string;
}

// Payment Response DTO
export interface MarketplacePaymentResponse {
  status: 'SUCCESS' | 'FAILED';
  transactionId?: string;
  message?: string;
}

// Backend DTO mirror (tn.esprit.spring.baladna.marketplace.dto.response.OrderResponse)
export interface MarketplaceOrder {
  idCommande: number;
  idUser: number;
  total: number;
  statut: MarketplaceOrderStatus;
  dateCreation?: string;
  updatedAt?: string;
  lignes: MarketplaceOrderLine[];
}

export interface MarketplaceOrderLine {
  idLigneCommande: number;
  idProduit: number;
  idArtisan?: number;
  nomProduit: string;
  quantite: number;
  prix: number;
  sousTotal: number;
}

export interface MarketplaceReview {
  idReview: number;
  idUser: number;
  idProduit: number;
  idCommande?: number | null;
  rating: number;
  commentaire?: string | null;
  dateCreation?: string;
  auteurNom?: string | null;
}

export interface MarketplaceReviewRequest {
  idUser: number;
  idProduit: number;
  idCommande?: number | null;
  rating: number;
  commentaire?: string | null;
}

export interface MarketplaceDashboardStat {
  label: string;
  value: string | number;
  hint?: string;
  trend?: 'up' | 'down' | 'flat';
   trendValue?: string;
  icon?: string;  // ← AJOUTER CETTE LIGNE
}

export interface MarketplaceUser {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  status?: string;
}

export interface MarketplaceUserStats {
  totalUsers?: number;
  activeUsers?: number;
  blockedUsers?: number;
  deletedUsers?: number;
  adminUsers?: number;
  touristUsers?: number;
  hostUsers?: number;
  artisanUsers?: number;
}

export interface MarketplaceActivityItem {
  title: string;
  description?: string;
  timestampIso: string;
  status?: MarketplaceOrderStatus | string;
}

