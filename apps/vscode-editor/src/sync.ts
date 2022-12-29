/*
 * connection.ts
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

import throttle from "lodash.throttle";

import { WebviewApi } from "vscode-webview";

import { 
  jsonRpcPostMessageRequestTransport, 
  jsonRpcPostMessageServer, 
  JsonRpcPostMessageTarget, 
  JsonRpcRequestTransport 
} from "core";

import { windowJsonRpcPostMessageTarget } from "core-browser";

import { 
  VSC_VE_ApplyExternalEdit, 
  VSC_VE_GetMarkdownFromState,
  VSC_VEH_OnEditorUpdated,
  VSC_VEH_OnEditorReady, 
  VSC_VE_Init, 
  VSCodeVisualEditor, 
  VSCodeVisualEditorHost, 
  EditorServer,
  EditorServices
} from "editor-types";

import { 
  editorJsonRpcServer, 
  editorJsonRpcServices 
} from "editor-core";

import { 
  EditorOperations, 
  UpdateEvent 
} from "editor";


export interface VisualEditorHostClient extends VSCodeVisualEditorHost {
  vscode: WebviewApi<unknown>;
  server: EditorServer;
  services: EditorServices;
}

// json rpc request client
export function visualEditorJsonRpcRequestTransport(vscode: WebviewApi<unknown>) {
  const target = windowJsonRpcPostMessageTarget(vscode, window);
  const { request } = jsonRpcPostMessageRequestTransport(target);
  return request;
}

// interface to visual editor host (vs code extension)
export function visualEditorHostClient(
  vscode: WebviewApi<unknown>, 
  request: JsonRpcRequestTransport
) : VisualEditorHostClient {
  return {
    vscode,
    server: editorJsonRpcServer(request),
    services: editorJsonRpcServices(request),
    ...editorJsonRpcContainer(request)
  }
}

export async function syncEditorToHost(
  editor: EditorOperations, 
  host: VisualEditorHostClient,
  focus: boolean
) {

  // sync from text editor (throttled)
  const kThrottleDelayMs = 1000;
  const receiveEdit = throttle((markdown) => {
    editor.setMarkdown(markdown, {}, false)
      .finally(() => {
        // done
      });
  }, kThrottleDelayMs, { leading: false, trailing: true});

  // setup communication channel for host
  visualEditorHostServer(host.vscode, {
    async init(markdown: string) {

      // init editor contents and sync cannonical version back to text editor
      const result = await editor.setMarkdown(markdown, {}, false);

      // focus if requested
      if (focus) {
        editor.focus();
      }
      
      // visual editor => text editor (just send the state, host will call back for markdown)
      editor.subscribe(UpdateEvent, () => host.onEditorUpdated(editor.getStateJson()));

      // return canonical markdown
      return result.canonical;        
    },

    async applyExternalEdit(markdown: string) {
      // only receive external text edits if we don't have focus (prevents circular updates)
      if (!editor.hasFocus() && !window.document.hasFocus()) {
        receiveEdit(markdown);
      }
    },

    async getMarkdownFromState(state: unknown) : Promise<string> {
      return editor.getMarkdownFromStateJson(state, {});
    },
  })

  // let the host know we are ready
  await host.onEditorReady();  
}

// interface provided to visual editor host (vs code extension)
function visualEditorHostServer(vscode: WebviewApi<unknown>, editor: VSCodeVisualEditor) {

  // target for message bus
  const target: JsonRpcPostMessageTarget = {
    postMessage: (data) => {
      vscode.postMessage(data);
    },
    onMessage: (handler: (data: unknown) => void) => {
      const messageListener = (event: MessageEvent) => {
        const message = event.data; // The json data that the extension sent
        handler(message);
      };
      window.addEventListener('message', messageListener);
      return () => {
        window.removeEventListener('message', messageListener);
      }
    }
  };

  // create a server
  return jsonRpcPostMessageServer(target, {
    [VSC_VE_Init]: args => editor.init(args[0]),
    [VSC_VE_GetMarkdownFromState]: args => editor.getMarkdownFromState(args[0]),
    [VSC_VE_ApplyExternalEdit]: args => editor.applyExternalEdit(args[0])
  })
}


function editorJsonRpcContainer(request: JsonRpcRequestTransport) : VSCodeVisualEditorHost {
  return {
    onEditorReady: () => request(VSC_VEH_OnEditorReady, []),
    onEditorUpdated: (state: unknown) => request(VSC_VEH_OnEditorUpdated, [state]),
  };
}
