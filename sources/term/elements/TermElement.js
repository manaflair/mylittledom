import { style }   from '@manaflair/term-strings';

import { Element } from '../../core';

export class TermElement extends Element {

    appendChild(node) {

        if (!(node instanceof TermElement))
            throw new Error(`Failed to execute 'appendChild': Parameter 1 is not of type 'TermElement'.`);

        return super.appendChild(node);

    }

    insertBefore(node, referenceNode) {

        if (!(node instanceof TermElement))
            throw new Error(`Failed to execute 'appendChild': Parameter 1 is not of type 'TermElement'.`);

        return super.insertBefore(node, referenceNode);


    }

    removeChild(node) {

        if (!(node instanceof TermElement))
            throw new Error(`Failed to execute 'appendChild': Parameter 1 is not of type 'TermElement'.`);

        return super.removeChild(node);

    }

    renderElement(x, y, l) {

        let processBorders = (x, y, l) => {

            let prepend = ``;
            let append = ``;

            if (y === 0 && this.style.$.borderTopCharacter) {

                let contentL = l;

                if (x === 0 && this.style.$.borderLeftCharacter) {
                    prepend = this.style.$.borderTopLeftCharacter;
                    contentL -= 1;
                }

                if (x + l === this.elementRect.width && this.style.$.borderRightCharacter) {
                    append = this.style.$.borderTopRightCharacter;
                    contentL -= 1;
                }

                let data = prepend + this.style.$.borderTopCharacter.repeat(contentL) + append;

                if (this.style.$.backgroundColor)
                    data = this.style.$.backgroundColor.back + data;

                if (this.style.$.borderColor)
                    data = this.style.$.borderColor.front + data;

                if (this.style.$.backgroundColor || this.style.borderColor)
                    data += style.clear;

                return data;

            } else if (y === this.elementRect.height - 1 && this.style.$.borderBottomCharacter) {

                let contentL = l;

                if (x === 0 && this.style.$.borderLeftCharacter) {
                    prepend = this.style.$.borderBottomLeftCharacter;
                    contentL -= 1;
                }

                if (x + l === this.elementRect.width && this.style.$.borderRightCharacter) {
                    append = this.style.$.borderBottomRightCharacter;
                    contentL -= 1;
                }

                let data = prepend + this.style.$.borderBottomCharacter.repeat(contentL) + append;

                if (this.style.$.backgroundColor)
                    data = this.style.$.backgroundColor.back + data;

                if (this.style.$.borderColor)
                    data = this.style.$.borderColor.front + data;

                if (this.style.$.backgroundColor || this.style.borderColor)
                    data += style.clear;

                return data;

            } else {

                let contentX = x;
                let contentY = y;
                let contentL = l;

                if (this.style.$.borderLeftCharacter) {

                    if (x === 0) {
                        prepend = this.style.$.borderLeftCharacter;
                        contentL -= 1;
                    } else {
                        contentX -= 1;
                    }

                }

                if (this.style.$.borderRightCharacter) {

                    if (x + l === this.elementRect.width) {
                        append = this.style.$.borderRightCharacter;
                        contentL -= 1;
                    }

                }

                if (this.style.$.backgroundColor) {

                    if (prepend)
                        prepend = this.style.$.backgroundColor.back + prepend;

                    if (append) {
                        append = this.style.$.backgroundColor.back + append;
                    }

                }

                if (this.style.$.borderColor) {

                    if (prepend)
                        prepend = this.style.$.borderColor.front + prepend;

                    if (append) {
                        append = this.style.$.borderColor.front + append;
                    }

                }

                if (this.style.$.backgroundColor || this.style.$.borderColor) {

                    if (prepend)
                        prepend += style.clear;

                    if (append) {
                        append += style.clear;
                    }

                }

                return prepend + processContent(contentX, contentY, contentL) + append;

            }

        };

        let processContent = (x, y, l) => {

            if (y < this.contentRect.y || y >= this.contentRect.y + this.contentRect.height) {
                return this.renderBackground(l);
            } else {
                y -= this.contentRect.y;
            }

            let prepend = ``;
            let append = ``;

            if (x < this.contentRect.x) {
                let size = Math.min(l, this.contentRect.x - x);
                prepend = this.renderBackground(size);
                x = 0, l -= size;
            } else {
                x -= this.contentRect.x;
            }

            if (x + l > this.contentRect.width) {
                let size = x + l - this.contentRect.width;
                append = this.renderBackground(size);
                l -= size;
            }

            let content = this.renderContent(x, y, l);

            return prepend + content + append;

        };

        return processBorders(x, y, l);

    }

    renderContent(x, y, l) {

        return this.renderBackground(l);

    }

    renderBackground(l) {

        let background = ``;

        if (this.style.$.backgroundColor)
            background += this.style.$.backgroundColor.back;

        if (this.style.$.color)
            background += this.style.$.color.front;

        background += this.style.$.backgroundCharacter.repeat(l);

        if (this.style.$.backgroundColor || this.style.$.color)
            background += style.clear;

        return background;

    }

}
