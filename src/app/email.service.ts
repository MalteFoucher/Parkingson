import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';

@Injectable()
export class EmailService {
  constructor (
    private http: Http
  ) {}

  getUser() {
    return this.http.get(`https://conduit.productionready.io/api/profiles/eric`)
    .map((res:Response) => res.json());
  }

  sendEmail() {
      console.log ("emailservice test");
    return this.http.get( "https://us-central1-parkingtool-6cf77.cloudfunctions.net/testEmail")
    .map((res:Response) => res.json());    
  }

}