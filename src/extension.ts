import { window, commands, ExtensionContext } from 'vscode';
import { LangModel } from "./langModel";

export function activate(context: ExtensionContext) {
  console.log('"monobank-lang-ext" is now active!');
  const langModel = new LangModel();

  let disposables = [
    commands.registerCommand('langExt.startWatching', () => {
      langModel.startWatching();
    }),
    commands.registerCommand('langExt.stopWatching', () => {
      langModel.stopWatching();
    }),
    commands.registerCommand('langExt.compile', () => {
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
