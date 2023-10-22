import { Directive, ElementRef, Output, EventEmitter, Input, OnInit, OnDestroy, ApplicationRef, ViewChildren, AfterViewInit, QueryList } from '@angular/core';

import { Subscription, fromEvent } from 'rxjs';
import { map, takeUntil, finalize, mergeMap, filter } from 'rxjs/operators';
import { DndListDirective } from './dnd-list.directive';

const shift = 60

@Directive({
  selector: '[app-dnd-list-item]'
})
export class DndListItemDirective implements AfterViewInit {

  @Input() zoom = 1

  subscription!: Subscription

  constructor(private element: ElementRef, private dndList: DndListDirective) {
  }

  ngAfterViewInit() {

    const itemElement: HTMLElement = this.element.nativeElement;

    const listElement = this.dndList.element.nativeElement

    const mouseup = fromEvent<MouseEvent>(document, 'mouseup');
    const mousemove = fromEvent<MouseEvent>(document, 'mousemove');
    const mousedown = fromEvent<MouseEvent>(itemElement, 'mousedown');

    const mousedrag = mousedown.pipe(

      mergeMap((md: MouseEvent) => {

        const siblings = this.getSiblings(listElement)

        const itemIndex = this.getItemIndex(listElement, itemElement)

        const { clientX: startX, clientY: startY } = md

        siblings.forEach((sibling) => {

          // Don't use a filter here
          if (sibling === itemElement) {
            return;
          }

          sibling.style.zIndex = '1';
          sibling.style.transition = 'transform 0.2s ease';
        })

        let newPosition = itemIndex

        let interectSibling: HTMLElement | undefined = undefined

        let orientation = 0

        return mousemove.pipe(

          /* Workaround for Shadow virtual desktop */
          filter((mm: MouseEvent) => mm.clientX !== startX || mm.clientY !== startY),
          filter((mm: MouseEvent) => mm.movementY !== 0),
          map((mm: MouseEvent) => {

            itemElement.style.transition = '';
            itemElement.style.zIndex = '1000';
            itemElement.style.pointerEvents = 'none'
            itemElement.classList.add('dragging')

            const top = (mm.clientY - startY) / this.zoom

            itemElement.style.transform = `translateY(${top}px)`

            // Look for intersection
            siblings.forEach((sibling, siblingIndex) => {

              // Don't use a filter here
              if (sibling === itemElement) {
                return;
              }

              const newOrientation = mm.movementY / Math.abs(mm.movementY)

              if (this.intersectRect(itemElement, sibling)
                && (interectSibling !== sibling || (interectSibling === sibling && newOrientation !== orientation))) {

                interectSibling = sibling

                newPosition = siblingIndex

                orientation = mm.movementY / Math.abs(mm.movementY)

                if (newOrientation > 0) {
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

            this.dndList.moved.emit({ item: itemIndex, position: newPosition })

            siblings.forEach((sibling) => {
              sibling.style.transform = ``
              sibling.style.transition = ``
            })
          }));
      })
    );

    this.subscription = mousedrag.subscribe(() => {
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe()
  }

  shiftUp(element: HTMLElement) {

    const transform = element.style.transform

    if (transform === '') {

      element.style.transform = `translateY(-${shift}px)`

    } else if (transform === `translateY(${shift}px)`) {

      element.style.transform = ''
    }
  }

  shiftDown(element: HTMLElement) {

    const transform = element.style.transform

    if (transform === '') {

      element.style.transform = `translateY(${shift}px)`

    } else if (transform === `translateY(-${shift}px)`) {

      element.style.transform = ''
    }
  }

  private intersectRect(item1: HTMLElement, item2: HTMLElement) {

    const proxyRect = item1.getBoundingClientRect();
    const dropRect = item2.getBoundingClientRect();

    const margin = 15

    return Math.max(proxyRect.left, dropRect.left) < Math.min(proxyRect.left + proxyRect.width, dropRect.left + dropRect.width) &&
      Math.max(proxyRect.top, dropRect.top + margin) < Math.min(proxyRect.top + proxyRect.height - margin, dropRect.top + dropRect.height - margin);
  }

  private getSiblings(listElement: HTMLElement) {

    return Array.from(listElement.children) as HTMLElement[];
  }

  private getItemIndex(listElement: HTMLElement, itemElement: HTMLElement) {

    const siblings = this.getSiblings(listElement)

    return siblings.findIndex(c => c === itemElement)
  }
}
