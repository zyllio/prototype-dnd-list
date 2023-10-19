import { Directive, ElementRef, Output, EventEmitter, Input, OnInit, OnDestroy, ApplicationRef } from '@angular/core';

import { fromEvent } from 'rxjs';
import { map, takeUntil, finalize, mergeMap, filter } from 'rxjs/operators';


@Directive({
  selector: '[app-dnd-list]'
})
export class DndListDirective implements OnInit {

  @Output() moved: EventEmitter<number> = new EventEmitter();

  @Input() margin = 0;

  @Input() zoom = 1;

  constructor(private element: ElementRef) {
  }

  ngOnInit(): void {

    setTimeout(() => {
      this.register();
    })
  }

  register() {

    const source: HTMLElement = this.element.nativeElement;

    const mouseup = fromEvent<MouseEvent>(document, 'mouseup');
    const mousemove = fromEvent<MouseEvent>(document, 'mousemove');
    const mousedown = fromEvent<MouseEvent>(source, 'mousedown');

    this.refresh(source);

    const mousedrag = mousedown.pipe(

      mergeMap((md: MouseEvent) => {

        let startSourceTop = source.offsetTop;

        const siblings = this.getSiblings(source);

        const startSourceIndex = siblings.findIndex(c => c === source);

        const startX = md.clientX
        
        const startY = md.clientY

        return mousemove.pipe(
          
          /* Workaround for Shadow virtual desktop */
          filter((mm: MouseEvent) => mm.clientX !== startX || mm.clientY !== startY),
          map((mm: MouseEvent) => {

          source.style.transition = 'none';
          source.style.zIndex = '1000';
          source.style.pointerEvents = 'none'
          source.classList.add('dragging')

          const top = (mm.clientY - startY) / this.zoom

          source.style.top = (startSourceTop + top) + 'px';

          const shift = Math.round(top / this.getItemHeight(source));

          let newIndex = startSourceIndex + shift;

          // Fix Boundaries
          newIndex = this.restrictToBoundaries(siblings, newIndex);

          const sourceIndex = siblings.findIndex(c => c === source);

          if (newIndex !== sourceIndex) {

            const otherSibling = siblings[newIndex];

            // Swap items
            siblings[newIndex] = source;
            siblings[sourceIndex] = otherSibling;

            this.moved.emit(newIndex);
          }

          siblings.forEach((sibling, index) => {

            // Don't use a filter here
            if (sibling === source) {
              return;
            }

            // Layer fix
            sibling.style.zIndex = '1';

            sibling.style.top = this.margin + (index * this.getItemHeight(source)) + 'px';
          });

        }),
          takeUntil(mouseup),
          finalize(() => {

            this.refresh(source);

            source.style.pointerEvents = 'all'

            source.classList.remove('dragging')
          }));
      })
    );

    mousedrag.subscribe(() => {
    });
  }

  private restrictToBoundaries(array: any[], index: number): number {

    let newIndex = (index < 0) ? 0 : index;
    newIndex = (newIndex > array.length - 1) ? array.length - 1 : newIndex;

    return newIndex;
  }

  private getSiblings(source: HTMLElement) {
    return Array.from(source.parentElement.children) as HTMLElement[];
  }

  /* Layout all chidren items using absolute coordinates */
  private refresh(source: HTMLElement, ignoreMe = false) {

    let siblings = this.getSiblings(source)

    if (ignoreMe === true) {
      siblings = siblings.filter(s => s !== source)
    }

    siblings.forEach((sibling, index) => {

      sibling.style.zIndex = 'unset';
      sibling.style.transition = 'top 0.2s ease';
      sibling.style.position = 'absolute';
      sibling.style.left = '0';
      sibling.style.right = '0';
      sibling.style.top = this.margin + (index * this.getItemHeight(source)) + 'px';
    });

    source.parentElement.style.height = this.margin + siblings.length * this.getItemHeight(source) + 'px';
  }

  private getItemHeight(source: HTMLElement) {
    return source.offsetHeight + this.margin;
  }
}