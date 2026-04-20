import { Reservation } from '../../features/tourist/models/reservation.model';
import { getCompactLocationText, getCompactRouteText } from './location-display.util';

export interface TransportTicketSnapshot {
  ticketCode: string;
  qrPayload: string;
  routeLabel: string;
  boardingPointLabel: string;
  reservedSeatsLabel: string;
  totalPriceLabel: string;
  reservationDateLabel: string;
  statusLabel: string;
  passengerName: string;
  passengerEmail: string;
}

export function buildTransportTicketCode(reservation: Reservation): string {
  if (reservation.ticketCode && reservation.ticketCode.trim()) {
    return reservation.ticketCode.trim();
  }

  // Fallback only: keep the local fingerprint stable and avoid tying it to a mutable status.
  const fingerprint = hashToBase36([
    reservation.id,
    reservation.transportId,
    reservation.reservedSeats,
    reservation.totalPrice,
    reservation.reservationDate,
    reservation.boardingPoint
  ].join('|'));

  return `BLD-${reservation.id.toString().padStart(4, '0')}-${fingerprint.slice(0, 6).toUpperCase()}`;
}

export function buildTransportTicketSnapshot(reservation: Reservation): TransportTicketSnapshot {
  const ticketCode = buildTransportTicketCode(reservation);

  return {
    ticketCode,
    // The scanner and backend validation endpoint both expect the raw ticket code.
    qrPayload: ticketCode,
    routeLabel: getCompactRouteText(reservation.transportRoute) || 'Transport reservation',
    boardingPointLabel: getCompactLocationText(reservation.transportDeparturePoint || reservation.boardingPoint) || reservation.boardingPoint || 'N/A',
    reservedSeatsLabel: `${reservation.reservedSeats} seat${reservation.reservedSeats > 1 ? 's' : ''}`,
    totalPriceLabel: `${reservation.totalPrice} DT`,
    reservationDateLabel: formatDateLabel(reservation.reservationDate),
    statusLabel: reservation.status,
    passengerName: reservation.userFullName || 'Passenger',
    passengerEmail: reservation.userEmail || 'Not provided'
  };
}

export function buildTransportTicketDocument(
  ticket: TransportTicketSnapshot,
  qrCodeDataUrl: string,
  viewerLabel: string
): string {
  const title = `Baladna ticket ${ticket.ticketCode}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 28px;
        font-family: Arial, Helvetica, sans-serif;
        color: #16324f;
        background: #f3f7fb;
      }
      .ticket-sheet {
        max-width: 860px;
        margin: 0 auto;
      }
      .ticket-card {
        display: grid;
        grid-template-columns: 1.4fr 320px;
        overflow: hidden;
        border-radius: 28px;
        background: white;
        border: 1px solid #d8e3ef;
        box-shadow: 0 18px 60px rgba(22, 50, 79, 0.12);
      }
      .ticket-main {
        padding: 34px;
      }
      .ticket-side {
        padding: 34px 30px;
        background: linear-gradient(180deg, #16324f 0%, #224e75 100%);
        color: white;
        text-align: center;
      }
      .eyebrow {
        display: inline-block;
        padding: 7px 14px;
        border-radius: 999px;
        background: #eef5fb;
        color: #224e75;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .viewer-label {
        display: inline-block;
        padding: 7px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.18);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      h1 {
        margin: 18px 0 10px;
        font-size: 34px;
        line-height: 1.1;
      }
      .route-copy {
        margin: 0 0 26px;
        color: #4c647c;
        font-size: 17px;
      }
      .ticket-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        margin-bottom: 26px;
      }
      .ticket-field {
        padding: 16px 18px;
        border-radius: 18px;
        background: #f7fafc;
        border: 1px solid #e5edf5;
      }
      .ticket-field span {
        display: block;
        margin-bottom: 6px;
        color: #6b8095;
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .ticket-field strong {
        display: block;
        font-size: 18px;
        line-height: 1.3;
      }
      .ticket-footer {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        padding-top: 18px;
        border-top: 1px dashed #cbd9e6;
        color: #5f7388;
        font-size: 14px;
      }
      .ticket-code {
        margin: 18px 0 14px;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: 0.08em;
      }
      .qr-frame {
        padding: 18px;
        border-radius: 24px;
        background: white;
        display: inline-block;
      }
      .qr-frame img {
        width: 220px;
        height: 220px;
        display: block;
      }
      .qr-caption {
        margin: 16px 0 0;
        color: rgba(255, 255, 255, 0.75);
        font-size: 14px;
        line-height: 1.5;
      }
      .status-pill {
        display: inline-block;
        margin-top: 16px;
        padding: 8px 14px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.14);
        border: 1px solid rgba(255, 255, 255, 0.18);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      @media print {
        body {
          padding: 0;
          background: white;
        }
        .ticket-card {
          box-shadow: none;
          border: 1px solid #d8e3ef;
        }
      }
    </style>
    <script>
      window.addEventListener('load', function () {
        var qrImage = document.querySelector('.qr-frame img');
        var didPrint = false;
        var triggerPrint = function () {
          if (didPrint) return;
          didPrint = true;
          setTimeout(function () {
            window.focus();
            window.print();
          }, 250);
        };

        if (qrImage && !qrImage.complete) {
          qrImage.addEventListener('load', triggerPrint, { once: true });
          qrImage.addEventListener('error', triggerPrint, { once: true });
        } else {
          triggerPrint();
        }
      });
    </script>
  </head>
  <body>
    <div class="ticket-sheet">
      <div class="ticket-card">
        <section class="ticket-main">
          <span class="eyebrow">Baladna transport ticket</span>
          <h1>${escapeHtml(ticket.routeLabel)}</h1>
          <p class="route-copy">Boarding point: ${escapeHtml(ticket.boardingPointLabel)}</p>

          <div class="ticket-grid">
            <div class="ticket-field">
              <span>Passenger</span>
              <strong>${escapeHtml(ticket.passengerName)}</strong>
            </div>
            <div class="ticket-field">
              <span>Email</span>
              <strong>${escapeHtml(ticket.passengerEmail)}</strong>
            </div>
            <div class="ticket-field">
              <span>Reserved seats</span>
              <strong>${escapeHtml(ticket.reservedSeatsLabel)}</strong>
            </div>
            <div class="ticket-field">
              <span>Total price</span>
              <strong>${escapeHtml(ticket.totalPriceLabel)}</strong>
            </div>
            <div class="ticket-field">
              <span>Booked on</span>
              <strong>${escapeHtml(ticket.reservationDateLabel)}</strong>
            </div>
            <div class="ticket-field">
              <span>Status</span>
              <strong>${escapeHtml(ticket.statusLabel)}</strong>
            </div>
          </div>

          <div class="ticket-footer">
            <span>Ticket code: ${escapeHtml(ticket.ticketCode)}</span>
            <span>Keep this document for boarding control.</span>
          </div>
        </section>

        <aside class="ticket-side">
          <span class="viewer-label">${escapeHtml(viewerLabel)}</span>
          <div class="ticket-code">${escapeHtml(ticket.ticketCode)}</div>
          <div class="qr-frame">
            <img src="${qrCodeDataUrl}" alt="QR code for ${escapeHtml(ticket.ticketCode)}" />
          </div>
          <div class="status-pill">${escapeHtml(ticket.statusLabel)}</div>
          <p class="qr-caption">The QR code encodes the reservation number, transport id, booking status, boarding point, and issued ticket code.</p>
        </aside>
      </div>
    </div>
  </body>
</html>`;
}

function formatDateLabel(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function hashToBase36(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0).toString(36).padStart(8, '0');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
