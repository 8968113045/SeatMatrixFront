import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
// Use environment file for API URLs if available in your project

@Injectable({
  providedIn: 'root'
})
export class SeatMatrixService {
  // Replace with your actual API base URL
  private apiUrl = 'https://localhost:44334/SeatMatrix';

  constructor(private http: HttpClient) { }

  // Dropdown APIs
  getStreams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/FetchStreams`);
  }

  getInstituteTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/FetchInstituteTypes`);
  }

  getInstitutes(typeId?: any): Observable<any[]> {
    // Pass params if necessary for cascading dropdowns
    return this.http.post<any[]>(`${this.apiUrl}/FetchInstitutes`, typeId);
  }

  getCourses(instituteId?: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/FetchCourses`, {
      params: { instituteId: instituteId || '' }
    });
  }

  // Seat Matrix APIs
  getSeatMatrixData(filters: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/FetchCategory`, filters);
  }

  getCategories(req: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/FetchCategoryList`, req);
  }

  saveSeatMatrixData(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/AddEditSeatMatrix`, data);
  }
}
