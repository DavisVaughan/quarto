/*
 * extension.ts
 *
 * Copyright (C) 2022 by Posit Software, PBC
 *
 * Unless you have received this program directly from Posit Software pursuant
 * to the terms of a commercial license agreement with Posit Software, then
 * this program is licensed to you under the terms of version 3 of the
 * GNU Affero General Public License. This program is distributed WITHOUT
 * ANY EXPRESS OR IMPLIED WARRANTY, INCLUDING THOSE OF NON-INFRINGEMENT,
 * MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE. Please refer to the
 * AGPL (http://www.gnu.org/licenses/agpl-3.0.txt) for more details.
 *
 */

import * as vscode from "vscode";
import QuartoLinkProvider, { OpenLinkCommand } from "./providers/link";
import QuartoDocumentSymbolProvider from "./providers/symbol-document";
import QuartoFoldingProvider from "./providers/folding";
import { PathCompletionProvider } from "./providers/completion-path";
import QuartoSelectionRangeProvider from "./providers/selection-range";
import QuartoWorkspaceSymbolProvider from "./providers/symbol-workspace";
import { MarkdownEngine } from "./markdown/engine";
import { activateBackgroundHighlighter } from "./providers/background";
import { kQuartoDocSelector } from "./core/doc";
import { Command, CommandManager } from "./core/command";
import { newDocumentCommands } from "./providers/newdoc";
import { insertCommands } from "./providers/insert";
import { activateDiagram } from "./providers/diagram/diagram";
import { activateOptionEnterProvider } from "./providers/option";
import { textFormattingCommands } from "./providers/text-format";
import { activateCodeFormatting } from "./providers/format";

export function activateCommon(
  context: vscode.ExtensionContext,
  engine: MarkdownEngine,
  commands?: Command[]
) {
  // core language features
  const symbolProvider = new QuartoDocumentSymbolProvider(engine);
  context.subscriptions.push(
    vscode.Disposable.from(
      vscode.languages.registerDocumentSymbolProvider(
        kQuartoDocSelector,
        symbolProvider
      ),
      vscode.languages.registerDocumentLinkProvider(
        kQuartoDocSelector,
        new QuartoLinkProvider(engine)
      ),
      vscode.languages.registerFoldingRangeProvider(
        kQuartoDocSelector,
        new QuartoFoldingProvider(engine)
      ),
      vscode.languages.registerSelectionRangeProvider(
        kQuartoDocSelector,
        new QuartoSelectionRangeProvider(engine)
      ),
      vscode.languages.registerWorkspaceSymbolProvider(
        new QuartoWorkspaceSymbolProvider(symbolProvider)
      ),
      PathCompletionProvider.register(engine)
    )
  );

  // option enter handler
  activateOptionEnterProvider(context, engine);

  // background highlighter
  activateBackgroundHighlighter(context, engine);

  // diagramming
  const diagramCommands = activateDiagram(context, engine);

  // code formatting
  const codeFormattingCommands = activateCodeFormatting(engine);

  // commands (common + passed)
  const commandManager = new CommandManager();
  commandManager.register(new OpenLinkCommand(engine));
  for (const cmd of codeFormattingCommands) {
    commandManager.register(cmd);
  }
  for (const cmd of textFormattingCommands()) {
    commandManager.register(cmd);
  }
  for (const cmd of newDocumentCommands()) {
    commandManager.register(cmd);
  }
  for (const cmd of insertCommands(engine)) {
    commandManager.register(cmd);
  }
  for (const cmd of diagramCommands) {
    commandManager.register(cmd);
  }
  if (commands) {
    for (const cmd of commands) {
      commandManager.register(cmd);
    }
  }
  context.subscriptions.push(commandManager);
}
