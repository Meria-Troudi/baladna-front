import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FactureResponse } from '../../../models/commande.model';

@Injectable({
  providedIn: 'root'
})
export class FactureService {
  private apiUrl = 'http://localhost:8081/api/factures';

  constructor(private http: HttpClient) {}

  genererFacture(commandeId: number): Observable<FactureResponse> {
    console.log('[FACTURE SERVICE] Appel API:', `${this.apiUrl}/generer/${commandeId}`);
    return this.http.post<FactureResponse>(`${this.apiUrl}/generer/${commandeId}`, {});
  }

  telechargerPdfDepuisBase64(pdfBase64: string, numeroFacture: string): void {
    console.log('[FACTURE SERVICE] Téléchargement du PDF:', numeroFacture);
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });

    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.href = url;
    link.download = `Facture_${numeroFacture}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
    console.log('[FACTURE SERVICE] PDF téléchargé avec succès');
  }
}