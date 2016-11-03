import { autobind }    from 'core-decorators';

import { TermElement } from './TermElement';

export class TermText extends TermElement {

    constructor({ textContent = ``, ... props } = {}) {

        super(props);

        this.textContentString = ``;
        this.textContentLines = [];
        this.textContentColumns = 0;
        this.textContentRows = 0;
        this.textContentLayout = [];

        this.textContent = textContent;

        this.addEventListener(`relayout`, this.handleRelayout);

    }

    get textContent() {

        return this.textContentString;

    }

    set textContent(textContent) {

        this.textContentString = String(textContent);
        this.textContentLines = this.textContentString.split(/\r\n|\r|\n/g);
        this.textContentColumns = Math.max(0, ... this.textContentLines.map(line => line.length));
        this.textContentRows = this.textContentLines.length;

        this.setDirtyLayoutFlag();

    }

    computeContentWidth() {

        return this.textContentColumns;

    }

    computeContentHeight() {

        if (this.contentRect.width >= this.textContentColumns)
            return this.textContentRows;

        return this.textContentLines.map(line => {
            return Math.ceil(line.length / this.contentRect.width);
        }).reduce((sum, n) => {
            return sum + n;
        }, 0);

    }

    appendChild(node) {

        throw new Error(`Failed to execute 'appendChild': This node does not support this method.`);

    }

    insertBefore(node) {

        throw new Error(`Failed to execute 'insertBefore': This node does not support this method.`);

    }

    removeChild(node) {

        throw new Error(`Failed to execute 'removeChild': This node does not support this method.`);

    }

    @autobind handleRelayout() {

        this.textContentLayout = this.textContentString.match(new RegExp(`(?:(?!\r\n|\r|\n).){1,${this.contentRect.width}}`, `g`));

    }

    renderContent(x, y, l) {

        if (this.textContentLayout.length <= y)
            return this.renderBackground(l);

        let line = this.textContentLayout[y].substr(x, l);

        return line + this.renderBackground(l - line.length);

    }

}
