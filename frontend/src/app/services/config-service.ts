import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigLoaderService } from './config-loader-service';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  constructor(private http: HttpClient, private config: ConfigLoaderService) {}

  getTeams(): Observable<any[]> {
    return this.http.get<any[]>(`${this.config.apiBaseUrl}/config/teams`);
  }

  getBudget(): Observable<any[]> {
    return this.http.get<any[]>(`${this.config.apiBaseUrl}/config/budget`);
  }

  getPositions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.config.apiBaseUrl}/config/positions`);
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.config.apiBaseUrl}/config/users`);
  }
}