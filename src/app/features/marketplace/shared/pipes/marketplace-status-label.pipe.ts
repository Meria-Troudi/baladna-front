import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'marketplaceStatusLabel',
})
export class MarketplaceStatusLabelPipe implements PipeTransform {
  transform(value?: string | null): string {
    if (!value) {
      return 'Unknown';
    }

    const normalized = value.toUpperCase();
    const labels: Record<string, string> = {
      CREATED: 'Created',
      PENDING: 'Pending',
      PAID: 'Paid',
      CONFIRMED: 'Confirmed',
      SHIPPED: 'Shipped',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
    };

    return labels[normalized] ?? normalized.charAt(0) + normalized.slice(1).toLowerCase();
  }
}

