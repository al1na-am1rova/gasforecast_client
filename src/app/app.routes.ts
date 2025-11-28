
import { RouterModule, Routes } from '@angular/router';
import { Login } from './components/login/login';
import { StationsUnits } from './components/stationsUnits/stationsUnits';
import { Notfound} from './components/notfound/notfound';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' }, 
  { path: 'login', component: Login },
  { path: 'stationsUnits', component: StationsUnits},
  { path: '**',  component: Notfound}
];