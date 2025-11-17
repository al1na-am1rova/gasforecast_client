import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './components/footer/footer.component';
import { Header } from './components/header/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Footer, Header], 
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('gasforecast_client');
}