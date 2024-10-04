import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appTwoDigitDecimalWithNegative]'
})
export class TwoDigitDecimalDirectiveWithNegative {

  private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Del', 'Delete'];

  constructor(private el: ElementRef) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Allow special keys like Backspace, Delete, Arrow keys, etc.
    if (this.specialKeys.indexOf(event.key) !== -1) {
      return;
    }

    // Get the current input value and the cursor position
    const current: string = this.el.nativeElement.value;
    const position = this.el.nativeElement.selectionStart;

    // Allow only digits, '-', and '.' to be typed
    if (!/[\d\.\-]/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Prevent multiple negative signs and allow '-' only at the beginning
    if (event.key === '-' && (position !== 0 || current.includes('-'))) {
      event.preventDefault(); // Block if '-' is not at the start or is already present
      return;
    }

    // Prevent more than one decimal point
    if (event.key === '.' && current.includes('.')) {
      event.preventDefault();
      return;
    }

    // Simulate the next input value
    const nextValue = this.getNextValue(current, event.key, position);

    // Check if the next value is valid (allow any number before the decimal, 2 digits after decimal)
    if (!this.isValidInput(nextValue)) {
      event.preventDefault();
    }
  }

  // Helper to construct the next input value by inserting the key at the correct position
  private getNextValue(current: string, key: string, position: number): string {
    return [current.slice(0, position), key, current.slice(position)].join('');
  }

  // Validate the constructed value to ensure it follows the rules for number formatting
  private isValidInput(value: string): boolean {
    const regex = new RegExp(/^-?\d*(\.\d{0,2})?$/); // Allows any number with up to 2 decimal places
    return regex.test(value);
  }
}
