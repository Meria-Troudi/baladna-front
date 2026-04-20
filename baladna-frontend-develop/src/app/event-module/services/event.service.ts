import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Event, EventMedia } from '../models/event.model';
import { EventDTO } from '../models/event-dto.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private static readonly API = 'http://localhost:8081/api';
  private eventsUrl = `${EventService.API}/events`; // Base events URL

  constructor(private http: HttpClient) {}

  getAllEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsUrl}/event/list`);
  }

  getMyEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsUrl}/event/host/me`);
  }

  getEventById(id: string): Observable<Event> {
    return this.http.get<Event>(`${this.eventsUrl}/event/get/${id}`);
  }

  createEvent(event: EventDTO): Observable<Event> {
    return this.http.post<Event>(`${this.eventsUrl}/event/add`, event);
  }

  updateEvent(id: string, event: EventDTO): Observable<Event> {
    return this.http.put<Event>(`${this.eventsUrl}/event/update/${id}`, event);
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.eventsUrl}/event/delete/${id}`);
  }

  getEventsByHost(hostId: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsUrl}/event/host/${hostId}`);
  }

  searchEvents(query: string): Observable<Event[]> {
    return this.http.get<Event[]>(`${this.eventsUrl}/event/search?q=${query}`);
  }

  // Media upload methods - fixed URLs to match backend
  uploadEventMedia(eventId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.eventsUrl}/${eventId}/media`, formData);
  }

  getEventMedia(eventId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.eventsUrl}/${eventId}/media`);
  }

  updateEventMediaOrder(eventId: string, mediaUpdates: Partial<EventMedia>[]): Observable<any> {
    return this.http.put(`${this.eventsUrl}/${eventId}/media/order`, mediaUpdates);
  }

  deleteEventMedia(mediaId: string): Observable<any> {
    return this.http.delete(`${this.eventsUrl}/media/${mediaId}`);
  }

  // Categories
  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.eventsUrl}/event/categories/enum`);
  }
}
