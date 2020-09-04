import { OutputChannel, window } from 'vscode';

export class OutputWindow {

    private static _msgChannel: OutputChannel;

    private static get msgChannel() {

        if (!OutputWindow._msgChannel) {
            OutputWindow._msgChannel = window.createOutputChannel('Live LANG Compile');
        }

        return OutputWindow._msgChannel;
    }

    static show(msgHeadline: string, body: string[], popUpToUI: boolean = false, addEndLine = false) {

        if (msgHeadline) {
            OutputWindow.msgChannel.appendLine(msgHeadline);
        }

        if (body) {
            body.forEach(msg => {
                OutputWindow.msgChannel.appendLine(msg);
            });
        }

        if (popUpToUI) {
            OutputWindow.msgChannel.show(true);
        }

        if (addEndLine) {
            OutputWindow.msgChannel.appendLine('--------------------');
        }
    }

    static dispose() {
        this.msgChannel.dispose();
    }

}