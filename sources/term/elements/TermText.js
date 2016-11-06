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

        this.textContentString = String(textContent).replace(/\r\n?/g, `\n`);
        this.textContentLines = this.textContentString.split(/\n/g);
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

        this.textContentLayout = [ `` ];

        for (let c of this.textContentString) {

            if (c === `\n`) {

                this.textContentLayout.push(``);

            } else {

                this.textContentLayout[this.textContentLayout.length - 1] += c;

                if (this.textContentLayout[this.textContentLayout.length - 1].length >= this.contentRect.width) {
                    this.textContentLayout.push(``);
                }

            }

        }

    }

    renderContent(x, y, l) {

        if (this.textContentLayout.length <= y)
            return this.renderBackground(l);

        let line = this.textContentLayout[y].substr(x, l);

        return line + this.renderBackground(l - line.length);

    }

}
