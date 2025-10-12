import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Player } from '../../models/Player';
import { PlayerService } from '../../services/player-service';
import { ConfigService } from '../../services/config-service';

@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './player-list.html',
  styleUrl: './player-list.css'
})

export class PlayerList implements OnInit {
  players = signal<Player[]>([]);
  teams = signal<any[]>([]);
  positions = signal<string[]>(['All']);
  primarySelection = signal<string>('All');
  secondarySelection = signal<string>('All');
  loading = signal(true);
  errorMessage = signal('');

  refreshTeams() {
this.loadData();
  }

  constructor(
    private playerService: PlayerService,
    private configService: ConfigService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);

    Promise.all([
      this.playerService.getPlayers().toPromise(),
      this.configService.getTeams().toPromise(),
      this.configService.getPositions().toPromise()
    ])
      .then(([players, teams, positions]) => {
        this.players.set(players || []);
        this.teams.set(teams || []);
        this.positions.set(['All', ...(positions || [])]);
      })
      .catch((err) => {
        console.error('Failed to load players list', err);
        this.errorMessage.set('Failed to load data.');
      })
      .finally(() => this.loading.set(false));
  }

  // --- Filtering Logic (same as Auction Dashboard) ---
  filteredPlayers = computed(() => {
    const primary = this.primarySelection();
    const secondary = this.secondarySelection();

    return this.players().filter((p) => {
      const primaryMatch = primary === 'All' || p.PrimaryPosition === primary;
      const secondaryMatch =
        secondary === 'All' || p.SecondaryPosition === secondary;

      if (primary === 'All' && secondary === 'All') return true;
      if (primary === 'All') return secondaryMatch;
      if (secondary === 'All') return primaryMatch;
      return primaryMatch && secondaryMatch;
    });
  });

  // --- Build teams with members (Captain + ViceCaptain + others) ---
  teamCompositions = computed(() => {
    const teamList = this.teams();
    const allPlayers = this.players();

    return teamList.map((team) => {
      const cap = allPlayers.find((p) => p.PlayerID === team.CapID);
      const vice = allPlayers.find((p) => p.PlayerID === team.ViceCapID);

      const others = allPlayers.filter(
        (p) =>
          p.TeamAssigned === team.TeamName &&
          p.PlayerID !== team.CapID &&
          p.PlayerID !== team.ViceCapID
      );

      const members = [cap, vice, ...others].filter(Boolean);
      const totalCost = members.reduce(
        (sum, p) => sum + (p?.SoldPrice || 0),
        0
      );

      return {
        name: team.TeamName,
        members,
        totalCost,
        capID:team.CapID,
        viceCapID:team.ViceCapID
      };
    });
  });

  setPrimarySelection(pos: string) {
    this.primarySelection.set(pos);
  }

  setSecondarySelection(pos: string) {
    this.secondarySelection.set(pos);
  }
}
