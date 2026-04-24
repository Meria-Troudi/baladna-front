export interface EventDTO {
  title: string;
  description: string;
  category: string;
  startAt?: string;
  endAt?: string;
  startAtStr?: string;
  endAtStr?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  price: number;
  createdByUserId: number;
  imageUrl?: string;
  additionalImages?: string[];
  status: string;
}
