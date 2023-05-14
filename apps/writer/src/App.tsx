/*
 * App.tsx
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

import React, { useEffect } from 'react';

import { Store } from 'redux';
import { Provider as StoreProvider } from 'react-redux';

import { FocusStyleManager } from '@blueprintjs/core';

import Workbench from './workbench/Workbench';
import { CommandManagerProvider } from 'editor-ui';
import { HotkeysProvider } from 'ui-widgets';

interface AppProps {
  store: Store;
}

const App: React.FC<AppProps> = props => {

  // only show focus on key navigation
  useEffect(() => {
    FocusStyleManager.onlyShowFocusOnTabs();
  }, []);

  // render
  return (
    <StoreProvider store={props.store}>
      <CommandManagerProvider>
        <HotkeysProvider>
          <Workbench/>
        </HotkeysProvider>
      </CommandManagerProvider>
    </StoreProvider>
  );


}

export default App;

