
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Gasforecast } from './components/gasforecast/gasforecast';
import { Notfound} from './components/notfound/notfound';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: 'login', component: Login },
  { path: 'gasforecast', component: Gasforecast},
  { path: '**',  component: Notfound}
];