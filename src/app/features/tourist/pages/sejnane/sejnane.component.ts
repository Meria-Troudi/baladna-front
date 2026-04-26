import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sejnane',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sejnane.component.html',
  styleUrls: ['./sejnane.component.css']
})
export class SejnaneComponent implements OnInit {
  artisans = [
    { name: 'Fatima Ben Ali', age: 54, photo: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200', rating: 4.9, products: 127, story: 'I learned pottery from my grandmother when I was 12.' },
    { name: 'Aicha Mansouri', age: 47, photo: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200', rating: 4.8, products: 89, story: 'Each pattern tells a story of the mountains and stars.' },
    { name: 'Mounira Trabelsi', age: 62, photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200', rating: 4.95, products: 203, story: 'My hands have shaped clay for 40 years.' }
  ];

  constructor() {}

  ngOnInit(): void {}

  playStory(artisan: any): void {
    const text = `${artisan.name}, ${artisan.age} years old. ${artisan.story} She has sold ${artisan.products} pieces.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}