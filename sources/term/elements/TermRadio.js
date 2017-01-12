import { Event }       from '../../core';

import { TermElement } from './TermElement';

export class TermRadio extends TermElement {

    constructor({ checked = false, ... props } = {}) {

        super(props);

        this.yogaNode.setMeasureFunc(maxWidth => {
            return { width: Math.min(maxWidth, 3), height: 1 };
        });

        this.setPropertyTrigger(`checked`, () => {
            this.setDirtyRenderingFlag();
            this.dispatchEvent(new Event(`change`));
        }, { initial: checked });

        this.addEventListener(`mousedown`, () => {
            this.checked = true;
        });

    }

    getInternalContentWidth() {

        return 3;

    }

    getInternalContentHeight() {

        return 1;

    }

    renderContent(x, y, l) {

        if (y === Math.floor(this.contentRect.height / 2)) {

            let fullLine = `(${this.checked ? `x` : ` `})`;
            let fullLineLength = fullLine.length;

            let fullLineStart = Math.floor((this.scrollRect.width - fullLineLength) / 2);

            let prefixLength = Math.max(0, Math.min(fullLineStart - x, l));
            let lineStart = Math.max(0, x - fullLineStart);
            let lineLength = Math.max(0, Math.min(fullLineLength - lineStart, l));
            let suffixLength = Math.max(0, l - prefixLength - lineLength);

            let prefix = this.renderBackground(prefixLength);
            let text = this.renderText(fullLine.substr(lineStart, lineLength));
            let suffix = this.renderBackground(suffixLength);

            return prefix + text + suffix;

        } else {

            return this.renderBackground(l);

        }

    }

}
