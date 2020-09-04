import {StatusBarItem, StatusBarAlignment, window} from 'vscode';

export class StatusBarUi {

    private static _statusBarItem: StatusBarItem;


    private static get statusBarItem() {
        if (!StatusBarUi._statusBarItem) {
            StatusBarUi._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 200);
            this.statusBarItem.show();
        }

        return StatusBarUi._statusBarItem;
    }

    static init() {
        StatusBarUi.working("Starting...");
    }

    static watching() {
        StatusBarUi.statusBarItem.text = `$(telescope) Watching...`;
        StatusBarUi.statusBarItem.color = 'inherit';
        StatusBarUi.statusBarItem.command = 'langExt.stopWatching';
        StatusBarUi.statusBarItem.tooltip = 'Stop live compilation of LANG';
    }

    static notWatching() {
        StatusBarUi.statusBarItem.text = `$(eye) Watch LANG`;
        StatusBarUi.statusBarItem.color = 'inherit';
        StatusBarUi.statusBarItem.command = 'langExt.startWatching';
        StatusBarUi.statusBarItem.tooltip = 'Live compilation of LANG typings';
    }

    static working(workingMsg:string = "Working on it...") {
        StatusBarUi.statusBarItem.text = `$(pulse) ${workingMsg}`;
        StatusBarUi.statusBarItem.tooltip = 'In case if it takes long time, Show output window and report.';
        StatusBarUi.statusBarItem.command = undefined;
    }

    // Quick status bar messages after compile success or error
    static compilationSuccess(isWatching: boolean) {
        StatusBarUi.statusBarItem.text = `$(check) Success`;
        StatusBarUi.statusBarItem.color = '#33ff00';
        StatusBarUi.statusBarItem.command = undefined;

        if(isWatching) {
            setTimeout( function() {
                StatusBarUi.statusBarItem.color = 'inherit';
                StatusBarUi.watching();
            }, 4500);
        }
        else {
            StatusBarUi.notWatching();
        }   
    }
    static compilationError(isWatching: boolean) {
        StatusBarUi.statusBarItem.text = `$(x) Error`;
        StatusBarUi.statusBarItem.color = '#ff0033';
        StatusBarUi.statusBarItem.command = undefined;

        if(isWatching) {
            setTimeout( function() {
                StatusBarUi.statusBarItem.color = 'inherit';
                StatusBarUi.watching();
            }, 4500);
        }
        else {
            StatusBarUi.notWatching();
        }
    }

    static dispose() {
        StatusBarUi.statusBarItem.dispose();
    }
}