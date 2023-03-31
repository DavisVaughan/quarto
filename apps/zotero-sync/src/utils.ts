/*
 * trace.ts
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

import path from "path";
import { quartoDataDir } from "quarto-core";


export function zoteroTrace(msg: string) {
  console.log(`[zotero]: ${msg}`);
}


export function webCollectionsDir(userId: number) {
  return quartoDataDir(path.join("zotero", "collections", "web", String(userId)));
}