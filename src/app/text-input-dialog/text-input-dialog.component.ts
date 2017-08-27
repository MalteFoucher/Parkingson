import { Component, OnInit, Inject } from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';


@Component({
  selector: 'app-text-input-dialog',
  templateUrl: './text-input-dialog.component.html',
  styleUrls: ['./text-input-dialog.component.css']
})
export class TextInputDialogComponent implements OnInit {

  titel: string ;
  innerHtmlString: string;
  user_email: string;

  constructor(@Inject(MD_DIALOG_DATA) public data: any) {
    console.log("Kontruktor TextInputDialog");
    this.titel = data.titel;
    this.innerHtmlString= data.html;
    this.user_email=data.email;    
   }



  ngOnInit() {
  }

}
