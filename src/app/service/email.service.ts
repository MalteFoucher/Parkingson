import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import 'rxjs/add/operator/map';

@Injectable()
export class EmailService {
  constructor (
    private http: HttpClient
  ) {}


  sendEmail(email: string) {
    return this.http.get( "https://us-central1-parkplatztool.cloudfunctions.net/testEmail?to="+email)
    .map((res:Response) => res.json());
  }

  deleteUser(uid: string, email: string) {
    return this.http.get ( "https://us-central1-parkplatztool.cloudfunctions.net/deleteUser?uid="+uid+"&e2rKey="+email.replace(/\./g,'!'));
  }

}
