import { style }                                     from '@manaflair/term-strings';

import { Element, Event, StyleManager, makeRuleset } from '../../core';

import { KeySequence }                               from './../misc/KeySequence';

export class TermElement extends Element {

    constructor(props) {

        super(props);

        this.declareEvent(`keypress`);

        this.declareEvent(`mousewheel`);

        this.declareEvent(`mousedown`);
        this.declareEvent(`mouseup`);

        this.declareEvent(`mousemove`);

        this.declareEvent(`mouseover`);
        this.declareEvent(`mouseout`);

        this.declareEvent(`mouseenter`);
        this.declareEvent(`mouseleave`);

        this.declareEvent(`click`);

        this.declareEvent(`change`);
        this.declareEvent(`submit`);

        this.declareEvent(`data`);

        this.isActive = false;

        this.addEventListener(`mousewheel`, e => {

            if (this.scrollHeight === this.offsetHeight)
                return;

            e.setDefault(() => {
                this.scrollTop += e.mouse.d * 2;
            });

        }, { capture: true });

        this.addEventListener(`mouseenter`, e => {

            this.styleManager.setStateStatus(`hover`, true);

            if (this.isActive) {
                this.styleManager.setStateStatus(`active`, true);
            }

        });

        this.addEventListener(`mouseleave`, e => {

            this.styleManager.setStateStatus(`hover`, false);

            if (this.isActive) {
                this.styleManager.setStateStatus(`active`, false);
            }

        });

        this.addEventListener(`mousedown`, e => {

            if (e.mouse.name !== `left`)
                return;

            this.styleManager.setStateStatus(`active`, true);
            this.isActive = true;

            if (!this.style.$.focusEvents)
                return;

            e.setDefault(() => {
                this.focus();
            });

        }, { capture: true });

        this.addEventListener(`mouseup`, e => {

            if (e.mouse.name !== `left`)
                return;

            if (this.rootNode.isActive) {

                let element = this.rootNode;

                disableLoop: while (element) {

                    element.styleManager.setStateStatus(`active`, false);
                    element.isActive = false;

                    for (let child of element.childNodes) {

                        if (!child.isActive)
                            continue;

                        element = child;
                        continue disableLoop;

                    }

                    break;

                }

            }

            e.setDefault(() => {

                let event = new Event(`click`, { bubbles: true });
                event.mouse = e.mouse;

                event.worldCoordinates = e.worldCoordinates;
                event.contentCoordinates = e.contentCoordinates;

                this.dispatchEvent(event);

            });

        }, { capture: true });

    }

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

    addShortcutListener(descriptors, callback, { capture = false } = {}) {

        if (!capture)
            throw new Error(`Failed to execute 'addShortcutListener': The 'capture' option needs to be set when adding a shortcut.`);

        for (let descriptor of descriptors.split(/,/g)) {

            let sequence = new KeySequence(descriptor);

            this.addEventListener(`keypress`, e => {

                if (!e.key)
                    return;

                if (sequence.add(e.key)) {
                    callback.call(this, e);
                }

            }, { capture });

        }

    }

    click(mouse) {

        this.dispatchEvent(Object.assign(new Event(`click`), { mouse }));

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

                if (!this.rootNode.debugPaintRects && this.style.$.backgroundColor && this.style.$.backgroundClip.doesIncludeBorders)
                    data = this.style.$.backgroundColor.back + data;

                if (!this.rootNode.debugPaintRects && this.style.$.borderColor)
                    data = this.style.$.borderColor.front + data;

                if (!this.rootNode.debugPaintRects && ((this.style.$.backgroundColor && this.style.$.backgroundClip.doesIncludeBorders) || this.style.$.borderColor))
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

                if (!this.rootNode.debugPaintRects && this.style.$.backgroundColor && this.style.$.backgroundClip.doesIncludeBorders)
                    data = this.style.$.backgroundColor.back + data;

                if (!this.rootNode.debugPaintRects && this.style.$.borderColor)
                    data = this.style.$.borderColor.front + data;

                if (!this.rootNode.debugPaintRects && ((this.style.$.backgroundColor && this.style.$.backgroundClip.doesIncludeBorders) || this.style.$.borderColor))
                    data += style.clear;

                return data;

            } else {

                let contentX = x;
                let contentY = y;
                let contentL = l;

                if (this.style.$.borderLeftCharacter) {

                    if (x === 0) {
                        prepend = this.style.$.borderLeftCharacter;
                        contentX += 1;
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

                if (this.style.$.backgroundColor && this.style.$.backgroundClip.doesIncludeBorders) {

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

                if ((this.style.$.backgroundColor && this.style.$.backgroundClip.doesIncludeBorders) || this.style.$.borderColor) {

                    if (prepend)
                        prepend += style.clear;

                    if (append) {
                        append += style.clear;
                    }

                }

                return prepend + processContent(contentX + this.scrollRect.x, contentY + this.scrollRect.y, contentL) + append;

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
                let size = Math.min(l, x + l - this.contentRect.width);
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

        if (l < 0)
            throw new Error(`Failed to execute 'renderBackground': Invalid length (${l}).`);

        if (l === 0)
            return ``;

        if (this.rootNode.debugPaintRects)
            return this.style.$.backgroundCharacter.repeat(l);

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

    renderText(text) {

        if (this.rootNode.debugPaintRects)
            return text;

        let prefix = ``;
        let suffix = ``;

        if (this.style.$.fontWeight < 400)
            prefix += style.fainted.in;
        else if (this.style.$.fontWeight > 400)
            prefix += style.emboldened.in;

        if (this.style.$.textDecoration && this.style.$.textDecoration.isUnderlined)
            prefix += style.underlined.in;

        if (this.style.$.backgroundColor)
            prefix += this.style.$.backgroundColor.back;

        if (this.style.$.color)
            prefix += this.style.$.color.front;

        if (prefix.length !== 0)
            suffix += style.clear;

        return prefix + text + suffix;

    }

}
