
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Stations } from './components/stations/stations';
import { Notfound} from './components/notfound/notfound';
import {AdminPage} from './components/admin-page/admin-page';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: 'login', component: Login },
  { path: 'stations', component: Stations},
  { path: 'adminPage', component: AdminPage},
  { path: '**',  component: Notfound}
];