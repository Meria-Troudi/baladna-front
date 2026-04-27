export type StatutCommande =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Commande {
  id: number;
  userId: number;
  statut: StatutCommande;
  total: number;
  paymentMethod: string;
  transactionId: string;
  adresseLivraison: string;
  telephone: string;
  nomClient: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequest {
  userId: number;
  total: number;
  paymentMethod: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  adresseLivraison: string;
  telephone: string;
  nomClient: string;
}

export interface CheckoutResponse {
  paymentStatus: 'SUCCESS' | 'FAILED';
  transactionId: string;
  commande: Commande;
  message: string;
}

export interface FactureResponse {
  id: number;
  numeroFacture: string;
  commandeId: number;
  touristeId: number;
  nomTouriste: string;
  emailTouriste: string;
  dateEmission: string;
  montantHT: number;
  tva: number;
  montantTTC: number;
  statut: string;
  pdfBase64: string;
  message: string;
}

export const STATUT_TIMELINE: StatutCommande[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED',
];

export const STATUT_LABELS: Record<StatutCommande, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédiée',
  IN_TRANSIT: 'En transit',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};