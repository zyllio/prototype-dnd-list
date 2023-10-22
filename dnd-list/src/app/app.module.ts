import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { DndListDirective } from './dnd-list.directive';
import { DndListItemDirective } from './dnd-list-item.directive';

@NgModule({
  declarations: [
    AppComponent,
    DndListDirective,
    DndListItemDirective
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
