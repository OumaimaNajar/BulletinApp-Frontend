import { HttpHeaders } from '@angular/common/http';

export const NGROK_HEADERS = new HttpHeaders({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
});