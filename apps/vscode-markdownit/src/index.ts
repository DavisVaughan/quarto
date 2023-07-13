/*
 * index.ts
 *
 * Copyright (C) 2022 by Posit Software, PBC
 * Copyright (c) 2016-2020 ParkSB.
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

import type * as MarkdownIt from 'markdown-it';
import type { ActivationFunction, OutputItem, RendererContext } from 'vscode-notebook-renderer';

import attrPlugin from "markdown-it-attrs";
import footnotes from "markdown-it-footnote";
import deflistPlugin from "markdown-it-deflist";
import subPlugin from "markdown-it-sub";
import supPlugin from 'markdown-it-sup';
import taskListPlugin from 'markdown-it-task-lists';

import { figuresPlugin } from 'core';
import { figureDivsPlugin } from 'core';
import { tableCaptionPlugin } from 'core';
import { spansPlugin } from 'core';
import { citationPlugin } from 'core';
import { divPlugin } from 'core';
import { calloutPlugin } from 'core';
import { decoratorPlugin } from 'core';
import { gridTableRulePlugin } from 'core';
import { shortcodePlugin } from 'core';
import { yamlPlugin } from 'core';
import { mermaidPlugin } from "core";

const styleHref = import.meta.url.replace(/index\.[\d\S]*\.?js$/, 'styles.css');

interface MarkdownItRenderer {
	extendMarkdownIt(fn: (md: MarkdownIt) => void): void;
  renderOutputItem: (x: unknown, y: unknown) => unknown;
}

export const activate: ActivationFunction = async (ctx: RendererContext<void>) => {
	const markdownItRenderer = await ctx.getRenderer('vscode.markdown-it-renderer') as MarkdownItRenderer | undefined;
  if (!markdownItRenderer) {
		throw new Error(`Could not load 'quarto.markdown-it.qmd-extension'`);
	}

  const renderOutputItem = markdownItRenderer.renderOutputItem.bind(markdownItRenderer);
  markdownItRenderer.renderOutputItem = (data: unknown, element: unknown) => {
    console.log("rendering output item");
    return renderOutputItem(data, element);
  }

  // Check whether this is a dark theme
  const isDark = document.body.classList.contains('vscode-dark') || document.body.classList.contains('vscode-high-contrast');

  // The shared stylesheet
  const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.classList.add('markdown-style');
	link.href = styleHref;

  // Inline styles
  const style = document.createElement('style');
	style.textContent = isDark ? `
  .callout-title-container  {
    color: var(--vscode-titleBar-activeBackground) !important;
  }
  ` : "";

  const styleTemplate = document.createElement('template');
	styleTemplate.classList.add('markdown-style');
	styleTemplate.content.appendChild(style);
	styleTemplate.content.appendChild(link);
	document.head.appendChild(styleTemplate);

	markdownItRenderer.extendMarkdownIt((md: MarkdownIt) => {
    const render = md.render.bind(md);
    md.render = (src: string, env: Record<string,unknown>) => {      

      // Do any text based transformations before the markdown is rendered

      ctx.postMessage?.("here is the message message");


      // Ensure that there are new lines at end divs
      src = src.replace(kCloseDivNoBlock, `$1\n\n$2`);
      return render(src, env);
    }

		return md.use(footnotes, {})
             .use(spansPlugin, {})
             .use(attrPlugin, {})
             .use(deflistPlugin, {})
             .use(figuresPlugin, {})
             .use(gridTableRulePlugin, {})
             .use(subPlugin, {})
             .use(supPlugin, {})
             .use(taskListPlugin, {})
             .use(divPlugin, {})
             .use(figureDivsPlugin, {})
             .use(tableCaptionPlugin, {})
             .use(citationPlugin, {})
             .use(mermaidPlugin, { dark: isDark }) // TODO: mermaid breaks other plugins
             .use(calloutPlugin, {})
             .use(decoratorPlugin, {})
             .use(yamlPlugin)
             .use(shortcodePlugin, {})
	});

  return undefined;
}

const kCloseDivNoBlock = /([^\s])\n(:::+(?:\{.*\})?)/gm;