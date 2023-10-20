import { Directive, ElementRef, Output, EventEmitter, Input, OnInit, OnDestroy, ApplicationRef } from '@angular/core';

import { fromEvent } from 'rxjs';
import { map, takeUntil, finalize, mergeMap, filter } from 'rxjs/operators';


@Directive({
  selector: '[app-dnd-list]'
})
export class DndListDirective implements OnInit {

  @Output() moved: EventEmitter<number> = new EventEmitter();

  @Input() zoom = 1;

  constructor(private element: ElementRef) {
  }

  ngOnInit(): void {

    const listElement: HTMLElement = this.element.nativeElement;

    const children = Array.from(listElement.children)

    children.forEach(itemElement => {
      this.registerItem(listElement, itemElement as HTMLElement)
    })
  }

  registerItem(listElement: HTMLElement, itemElement: HTMLElement) {

    const mouseup = fromEvent<MouseEvent>(document, 'mouseup');
    const mousemove = fromEvent<MouseEvent>(document, 'mousemove');
    const mousedown = fromEvent<MouseEvent>(itemElement, 'mousedown');

    const siblings = this.getSiblings(listElement)

    const mousedrag = mousedown.pipe(

      mergeMap((md: MouseEvent) => {

        const { clientX: startX, clientY: startY } = md

        siblings.forEach((sibling, siblingIndex) => {

          // Don't use a filter here
          if (sibling === itemElement) {
            return;
          }

          sibling.style.zIndex = '1';
          sibling.style.transition = 'transform 0.1s ease';

        });

        let freeIndex = this.getItemIndex(listElement, itemElement)


        return mousemove.pipe(

          /* Workaround for Shadow virtual desktop */
          filter((mm: MouseEvent) => mm.clientX !== startX || mm.clientY !== startY),
          map((mm: MouseEvent) => {

            itemElement.style.transition = 'none';
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
              }

            })

            // console.log('interectSibling', interectSibling)

            const intersectIndex = this.getItemIndex(listElement, interectSibling!)


            console.log('intersectIndex', intersectIndex)

            siblings.forEach((sibling, siblingIndex) => {

              // Don't use a filter here
              if (sibling === itemElement) {
                return;
              }

              if (siblingIndex === intersectIndex) {
                console.log('siblingIndex === intersectIndex', siblingIndex === intersectIndex)

                const top2 = (freeIndex < siblingIndex) ? '-60' : '60'

                sibling.style.transform = `translateY(${top2}px)`

                freeIndex = siblingIndex
              }
            })

          }),
          takeUntil(mouseup),
          finalize(() => {

            itemElement.style.pointerEvents = 'all'

            itemElement.classList.remove('dragging')
          }));
      })
    );

    mousedrag.subscribe(() => {
    });
  }

  private intersectRect(item1: HTMLElement, item2: HTMLElement) {

    const proxyRect = item1.getBoundingClientRect();
    const dropRect = item2.getBoundingClientRect();

    return Math.max(proxyRect.left, dropRect.left) < Math.min(proxyRect.left + proxyRect.width, dropRect.left + dropRect.width) &&
      Math.max(proxyRect.top, dropRect.top) < Math.min(proxyRect.top + proxyRect.height, dropRect.top + dropRect.height);
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