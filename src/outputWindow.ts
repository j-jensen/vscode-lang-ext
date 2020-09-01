import * as vscode from 'vscode';

export class OutputWindow {

    private static _msgChannel: vscode.OutputChannel;

    private static get msgChannel() {

        if (!OutputWindow._msgChannel) {
            OutputWindow._msgChannel = vscode.window.createOutputChannel('Live Sass Compile');
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