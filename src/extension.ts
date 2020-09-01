import * as vscode from 'vscode';
import { LangModel } from "./langModel";

export function activate(context: vscode.ExtensionContext) {
  console.log('"monobank-lang-ext" is now active!');
  const langModel = new LangModel();

  let disposables = [
    vscode.commands.registerCommand('langExt.startWatching', () => {
      langModel.startWatching();
    }),
    vscode.commands.registerCommand('langExt.stopWatching', () => {
      langModel.stopWatching();
    }),
    vscode.commands.registerCommand('langExt.compile', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        langModel.compile(editor.document.uri);
      }
    })
  ];

  context.subscriptions.push(...disposables);
  langModel.startWatching();
}

export function deactivate() { }
