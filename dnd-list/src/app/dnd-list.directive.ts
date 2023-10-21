import { Directive, ElementRef, Output, EventEmitter, Input, OnInit, OnDestroy, ApplicationRef, ViewChildren, AfterViewInit } from '@angular/core';

import { fromEvent } from 'rxjs';
import { map, takeUntil, finalize, mergeMap, filter } from 'rxjs/operators';

const shift = 60

@Directive({
  selector: '[app-dnd-list]'
})
export class DndListDirective implements AfterViewInit {

  @Output() moved: EventEmitter<{ item: number, position: number }> = new EventEmitter();

  @Input() zoom = 1;

  // @ViewChildren(ChildDirective) viewChildren!: QueryList<ChildDirective>;

  constructor(private element: ElementRef) {
  }

  ngAfterViewInit() {

    const listElement: HTMLElement = this.element.nativeElement;

    const children = Array.from(listElement.children)

    children.forEach((itemElement) => {
      this.registerItem(listElement, itemElement as HTMLElement)
    })
  }

  registerItem(listElement: HTMLElement, itemElement: HTMLElement) {

    const mouseup = fromEvent<MouseEvent>(document, 'mouseup');
    const mousemove = fromEvent<MouseEvent>(document, 'mousemove');
    const mousedown = fromEvent<MouseEvent>(itemElement, 'mousedown');

    const siblings = this.getSiblings(listElement)

    const itemIndex = this.getItemIndex(listElement, itemElement)

    const mousedrag = mousedown.pipe(

      mergeMap((md: MouseEvent) => {

        const { clientX: startX, clientY: startY } = md

        siblings.forEach((sibling, siblingIndex) => {

          // Don't use a filter here
          if (sibling === itemElement) {
            return;
          }

          sibling.style.zIndex = '1';
          sibling.style.transition = 'transform 0.2s ease';

        })

        let newPosition = itemIndex

        return mousemove.pipe(

          /* Workaround for Shadow virtual desktop */
          filter((mm: MouseEvent) => mm.clientX !== startX || mm.clientY !== startY),
          map((mm: MouseEvent) => {

            itemElement.style.transition = '';
            itemElement.style.zIndex = '1000';
            itemElement.style.pointerEvents = 'none'
            itemElement.classList.add('dragging')

            const top = (mm.clientY - startY) / this.zoom

            itemElement.style.transform = `translateY(${top}px)`

            let interectSibling: HTMLElement | undefined = undefined

            // Look for intersection
            siblings.forEach((sibling, siblingIndex) => {

              // Don't use a filter here
              if (sibling === itemElement) {
                return;
              }

              if (this.intersectRect(itemElement, sibling)) {
                interectSibling = sibling

                if (mm.movementY === 1) {
                  this.shiftUp(sibling)
                } else {
                  this.shiftDown(sibling)
                }
              }
            })


          }),
          takeUntil(mouseup),
          finalize(() => {

            itemElement.style.pointerEvents = 'all'

            itemElement.classList.remove('dragging')

            this.moved.emit({ item: itemIndex, position: newPosition })

            siblings.forEach((sibling, siblingIndex) => {
              sibling.style.transform = ``
              sibling.style.transition = ``
            })
          }));
      })
    );

    mousedrag.subscribe(() => {
    });
  }

  shiftUp(element: HTMLElement) {

    const transform = element.style.transform

    if (transform === '') {

      element.style.transform = `translateY(-${shift}px)`

    } else if (transform === `translateY(${shift}px)`) {

      element.style.transform = ''
    }

    console.log("transform ", transform, element.style.transform);

  }

  shiftDown(element: HTMLElement) {

    const transform = element.style.transform

    if (transform === '') {

      element.style.transform = `translateY(${shift}px)`

    } else if (transform === `translateY(-${shift}px)`) {

      element.style.transform = ''
    }

    console.log("transform ", transform, element.style.transform);
  }

  private intersectRect(item1: HTMLElement, item2: HTMLElement) {

    const proxyRect = item1.getBoundingClientRect();
    const dropRect = item2.getBoundingClientRect();

    const margin = 15

    return Math.max(proxyRect.left, dropRect.left) < Math.min(proxyRect.left + proxyRect.width, dropRect.left + dropRect.width) &&
      Math.max(proxyRect.top, dropRect.top + margin) < Math.min(proxyRect.top + proxyRect.height - margin, dropRect.top + dropRect.height - margin);
  }

  private restrictToBoundaries(array: any[], index: number): number {

    let newIndex = (index < 0) ? 0 : index;
    newIndex = (newIndex > array.length - 1) ? array.length - 1 : newIndex;

    return newIndex;
  }

  private getSiblings(listElement: HTMLElement) {
    return Array.from(listElement.children) as HTMLElement[];
  }

  private getItemIndex(listElement: HTMLElement, itemElement: HTMLElement) {

    const siblings = this.getSiblings(listElement)

    return siblings.findIndex(c => c === itemElement)
  }

}
