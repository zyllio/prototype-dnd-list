import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  items = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

  moved({ item, position }: { item: number, position: number }) {
    console.log("item, position ", item, position);

    const element = this.items.splice(item, 1)[0]

    this.items.splice(position, 0, element)

    
    console.log('this.items', this.items)



  }

  delete(index: number) {
    console.log('delete(index', index)
    this.items.splice(index, 1)
  }
}
