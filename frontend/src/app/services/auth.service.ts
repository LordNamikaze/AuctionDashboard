import { Injectable } from '@angular/core';
import { ConfigService } from './config-service';
import { firstValueFrom } from 'rxjs';

export type UserRole = 'admin' | 'readonly' | null;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentRole: UserRole = null;
  private isAuthenticated = false;

  constructor(private configService: ConfigService) {}

  async login(email: string): Promise<UserRole> {
    try {
      const users = await firstValueFrom(this.configService.getUsers());
      
      if (users.Admins.includes(email)) {
        this.currentRole = 'admin';
        this.isAuthenticated = true;
        return 'admin';
      } 
      
      if (users.ReadOnlyUsers.includes(email)) {
        this.currentRole = 'readonly';
        this.isAuthenticated = true;
        return 'readonly';
      }

      this.currentRole = null;
      this.isAuthenticated = false;
      throw new Error('Invalid email');
      
    } catch (error) {
      this.currentRole = null;
      this.isAuthenticated = false;
      throw error;
    }
  }

  logout() {
    this.currentRole = null;
    this.isAuthenticated = false;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated;
  }

  getRole(): UserRole {
    return this.currentRole;
  }
}