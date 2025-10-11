import { Component, signal } from '@angular/core';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  imports: [AdminDashboard, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
