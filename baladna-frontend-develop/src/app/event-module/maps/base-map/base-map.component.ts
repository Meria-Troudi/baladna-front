import { Component, Input } from '@angular/core';
 
@Component({
  selector: 'app-base-map',
  templateUrl: './base-map.component.html',
  styleUrls: ['./base-map.component.css']
})
export class BaseMapComponent {
  @Input() items: any[] = [];
}
