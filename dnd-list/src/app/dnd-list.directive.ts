import { Directive, ElementRef, EventEmitter, Output } from '@angular/core';

@Directive({
  selector: '[app-dnd-list]'
})
export class DndListDirective {

  @Output() moved: EventEmitter<{ item: number, position: number }> = new EventEmitter()

  constructor(public element: ElementRef) {
  }
}
