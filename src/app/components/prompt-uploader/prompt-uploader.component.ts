import { Component, OnInit } from '@angular/core';
import {ChromeExtensionService} from "../../services/chrome-extension.service";

@Component({
    selector: 'app-prompt-uploader',
    templateUrl: './prompt-uploader.component.html',
    styleUrls: ['./prompt-uploader.component.less']
})
export class PromptUploaderComponent implements OnInit {
    fileText = ''
    fileName = ''
    constructor(
        private chromeExtensionService: ChromeExtensionService
    ) { }

    ngOnInit(): void {
        return;
    }

    fileChanged(e: any) {
        if (e.target.files && e.target.files.length) {
            this.fileText = ''
            this.fileName = ''
            const file = e.target.files[0];
            this.fileName = file.name;
            console.log('type', file.name);
            if (file.type === 'text/plain') {
                this.readFile(e, file)
            }
        }
    }
    readFile(event: any,file: File) {
        let fileReader = new FileReader();
        fileReader.onload = (e) => {
            console.log('fileReader.result', fileReader.result)
            console.log(fileReader.result);
            if (fileReader.result) {
                this.fileText = fileReader.result.toString();
                if (event.target) {
                    event.target.value = '';
                }
            }

        }
        fileReader.readAsText(file);
    }

    copyToPrompt() {
        if (chrome.tabs) {
            this.chromeExtensionService.sendMessageToContentScript('copy-prompt', {prompt: this.fileText})
        }
    }

}
