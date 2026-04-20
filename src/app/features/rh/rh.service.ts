
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Interview, Application, ApplicationRequest, InterviewRequest } from './rh.model';

@Injectable({ providedIn: 'root' })
export class RhService {

  private apiUrl = 'http://localhost:8081/api/rh';
  private webhookUrl = 'https://fatmathaouri.app.n8n.cloud/webhook-test/f0b2dddd-727e-4816-92ce-3dae6ab2ad7d';

  constructor(private http: HttpClient) {}

  // ===== PUBLIC =====

  getOpenInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.apiUrl}/interviews`);
  }

  getInterview(id: number): Observable<Interview> {
    return this.http.get<Interview>(`${this.apiUrl}/interviews/${id}`);
  }

  apply(request: ApplicationRequest, cvFile: File): Observable<Application> {
    const formData = new FormData();
    formData.append('data', new Blob(
      [JSON.stringify(request)],
      { type: 'application/json' }
    ));
    formData.append('cv', cvFile);
    return this.http.post<Application>(`${this.apiUrl}/apply`, formData);
  }

  // ===== ADMIN =====

  getAllInterviews(): Observable<Interview[]> {
    return this.http.get<Interview[]>(`${this.apiUrl}/admin/interviews`);
  }

  createInterview(data: InterviewRequest): Observable<Interview> {
    return this.http.post<Interview>(`${this.apiUrl}/admin/interviews`, data);
  }

  updateInterviewStatus(id: number, status: string): Observable<Interview> {
    return this.http.put<Interview>(
      `${this.apiUrl}/admin/interviews/${id}/status?status=${status}`, {}
    );
  }

  deleteInterview(id: number): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/admin/interviews/${id}`,
      { responseType: 'text' }
    );
  }

  getApplications(interviewId: number): Observable<Application[]> {
    return this.http.get<Application[]>(
      `${this.apiUrl}/admin/interviews/${interviewId}/applications`
    );
  }

  updateApplicationStatus(id: number, status: string): Observable<Application> {
    return this.http.put<Application>(
      `${this.apiUrl}/admin/applications/${id}/status?status=${status}`, {}
    );
  }

  notifyWebhook(email: string): Observable<any> {
    return this.http.post(this.webhookUrl, { email }, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}