import { Directive, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
    selector: '[appDragAndDrop]'
})
export class DragAndDropDirective {

    constructor() { }

    @Output() fileDropped = new EventEmitter<FileList>();

    @HostListener('dragover', ['$event']) onDragOver(evt: any) {
        evt.preventDefault();
        evt.stopPropagation();
    }

    @HostListener('dragleave', ['$event']) public onDragLeave(evt: any) {
        evt.preventDefault();
        evt.stopPropagation();
    }

    @HostListener('drop', ['$event']) public ondrop(evt: any) {
        evt.preventDefault();
        evt.stopPropagation();
        const files = evt.dataTransfer.files;
        if (files.length > 0) {
            this.fileDropped.emit(files);
        }
    }
}
