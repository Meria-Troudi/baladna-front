 import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-tourist-favorites',
  templateUrl: './tourist-favorites.component.html',
  styleUrls: ['./tourist-favorites.component.css']
})
export class TouristFavoritesComponent  implements OnInit {
 
  

  constructor(private router: Router) {}

  ngOnInit(): void {}

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }
}

