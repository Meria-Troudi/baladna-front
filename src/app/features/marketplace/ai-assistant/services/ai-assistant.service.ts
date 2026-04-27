// ai-assistant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AiResponse {
  success: boolean;
  transcribedText: string;
  message: string;
  rawAiReply: string;
  action: string;
}

@Injectable({ providedIn: 'root' })
export class AiAssistantService {

  // Adaptez le port si votre backend tourne sur un autre port
  private apiUrl = 'http://localhost:8081/api/ai';

  constructor(private http: HttpClient) {}

  /** Commande vocale — envoie le blob audio au backend */
sendVoice(audioBlob: Blob, artisanId: number, artisanName: string): Observable<AiResponse> {
  // Pour la voix, on envoie le texte transcrit directement
  // (le Web Speech API transcrit côté frontend)
  return this.sendText('', artisanId, artisanName);
}
  /** Commande texte */
sendText(text: string, artisanId: number, artisanName: string): Observable<AiResponse> {
  const body = { message: text, artisanId: artisanId };
  return this.http.post<AiResponse>(`${this.apiUrl}/chat`, body).pipe(
    catchError(this.handleError)
  );
}
  /** Text-to-Speech natif navigateur (gratuit, aucune clé API) */
  speak(text: string): void {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    // Nettoyer les emojis pour la synthèse vocale
    const cleanText = text.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();

    const u = new SpeechSynthesisUtterance(cleanText);
    u.lang  = 'fr-FR';
    u.rate  = 1.0;
    u.pitch = 1.0;

    // Choisir une voix française si disponible
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang.startsWith('fr'));
    if (frVoice) u.voice = frVoice;

    window.speechSynthesis.speak(u);
  }

  stopSpeaking(): void {
    window.speechSynthesis?.cancel();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('AI Service Error:', error);
    return throwError(() => error);
  }
  
}
