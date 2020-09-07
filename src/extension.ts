import { window, commands, ExtensionContext } from 'vscode';
import { LangModel } from "./langModel";

export function activate(context: ExtensionContext) {
  console.log('"liveLangCompiler" is now active!');
  const langModel = new LangModel();

  let disposables = [
    commands.registerCommand('liveLangCompiler.command.startWatching', () => {
      langModel.startWatching();
    }),
    commands.registerCommand('liveLangCompiler.command.stopWatching', () => {
      langModel.stopWatching();
    }),
    commands.registerCommand('liveLangCompiler.command.compile', () => {
      const editor = window.activeTextEditor;
      if (editor) {
        langModel.compile(editor.document.uri);
      }
    })
  ];

  context.subscriptions.push(...disposables);
  langModel.startWatching();
}

export function deactivate() { }
