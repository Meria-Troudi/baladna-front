import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

import { Reservation } from '../../features/tourist/models/reservation.model';
import {
  buildTransportTicketCode,
  buildTransportTicketDocument,
  buildTransportTicketSnapshot
} from '../utils/transport-ticket.util';

@Injectable({
  providedIn: 'root'
})
export class TransportTicketService {
  private readonly qrCache = new Map<number, string>();

  getTicketCode(reservation: Reservation): string {
    return buildTransportTicketCode(reservation);
  }

  async getTicketQrCodeDataUrl(reservation: Reservation): Promise<string> {
    const cached = this.qrCache.get(reservation.id);
    if (cached) {
      return cached;
    }

    const snapshot = buildTransportTicketSnapshot(reservation);
    const dataUrl = await QRCode.toDataURL(snapshot.qrPayload, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#16324f',
        light: '#ffffff'
      }
    });

    this.qrCache.set(reservation.id, dataUrl);
    return dataUrl;
  }

  async openTicketPdf(reservation: Reservation, viewerLabel: string): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    const popup = window.open('', '_blank', 'width=960,height=760');

    if (!popup) {
      throw new Error('Please allow pop-ups to download the ticket PDF.');
    }

    popup.document.open();
    popup.document.write(this.buildLoadingDocument());
    popup.document.close();

    try {
      const qrCodeDataUrl = await this.getTicketQrCodeDataUrl(reservation);
      const ticketSnapshot = buildTransportTicketSnapshot(reservation);

      popup.document.open();
      popup.document.write(buildTransportTicketDocument(ticketSnapshot, qrCodeDataUrl, viewerLabel));
      popup.document.close();
      popup.focus();
    } catch (error) {
      popup.document.open();
      popup.document.write(this.buildErrorDocument());
      popup.document.close();
      throw error;
    }
  }

  private buildLoadingDocument(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Preparing ticket PDF...</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Arial, Helvetica, sans-serif;
        background: #f3f7fb;
        color: #16324f;
      }
      .loading-card {
        padding: 28px 32px;
        border-radius: 24px;
        background: white;
        border: 1px solid #d8e3ef;
        box-shadow: 0 18px 60px rgba(22, 50, 79, 0.12);
        text-align: center;
      }
      .spinner {
        width: 44px;
        height: 44px;
        margin: 0 auto 16px;
        border-radius: 50%;
        border: 4px solid #d8e3ef;
        border-top-color: #224e75;
        animation: spin 0.8s linear infinite;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 22px;
      }
      p {
        margin: 0;
        color: #5f7388;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div class="loading-card">
      <div class="spinner"></div>
      <h1>Preparing your PDF ticket</h1>
      <p>The ticket will open in this window in a moment.</p>
    </div>
  </body>
</html>`;
  }

  private buildErrorDocument(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Ticket PDF error</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Arial, Helvetica, sans-serif;
        background: #fff7f7;
        color: #991b1b;
      }
      .error-card {
        padding: 28px 32px;
        border-radius: 24px;
        background: white;
        border: 1px solid #fecaca;
        box-shadow: 0 18px 60px rgba(153, 27, 27, 0.12);
        text-align: center;
        max-width: 420px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 22px;
      }
      p {
        margin: 0;
        color: #7f1d1d;
      }
    </style>
  </head>
  <body>
    <div class="error-card">
      <h1>Unable to prepare the PDF ticket</h1>
      <p>Please close this window and try again.</p>
    </div>
  </body>
</html>`;
  }
}
