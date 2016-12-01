import { Key, Mouse, parseTerminalInputs } from '@manaflair/term-strings/parse';
import { cursor, screen, style }           from '@manaflair/term-strings';
import { autobind }                        from 'core-decorators';
import { isEmpty, isUndefined, merge }     from 'lodash';
import { Readable, Writable }              from 'stream';

import { Event }                           from '../../core';

import { TermElement }                     from './TermElement';

// We will iterate through those colors when rendering if the debugPaintRects option is set
let DEBUG_COLORS = [ `red`, `green`, `blue`, `magenta` ], currentDebugColorIndex = 0;

export class TermScreen extends TermElement {

    constructor({ debugPaintRects, ... attributes } = {}) {

        super(attributes);

        // We set the default style properties of every TermScreen instance
        Object.assign(this.style.element, {
            position: `relative`
        });

        // We prevent this element from being set as child of another node
        Reflect.defineProperty(this, `parentNode`, {
            value: null,
            writable: false
        });

        // We keep track of whether the screen is setup or not (has stdin/stdout)
        this.ready = false;

        // Input/output streams
        this.stdin = null;
        this.stdout = null;

        // Our subscription to the input events
        this.subscription = null;

        // When enabled, each repaint will use a different background color
        this.debugPaintRects = debugPaintRects;

        // A setImmediate timer used to trigger a rerender after the node becomes dirty
        this.dirtyTimer = null;

        // Bind the listener that will notify us when the node becomes dirty
        this.addEventListener(`dirty`, this.handleDirty, { capture: true });

        // Bind the listener that will notify us when the caret position has changed on an element
        this.addEventListener(`caret`, this.handleCaret, { capture: true });

        // Bind the listeners that enable navigating between focused elements
        this.addShortcutListener(`S-tab`, e => e.setDefault(() => this.focusPreviousElement()), { capture: true });
        this.addShortcutListener(`tab`, e => e.setDefault(() => this.focusNextElement()), { capture: true });

        // Bind the listener that exit the application on C-c
        this.addShortcutListener(`C-c`, e => e.setDefault(() => process.exit(0)), { capture: true });

    }

    attachScreen({ stdin = process.stdin, stdout = process.stdout } = {}) {

        if (this.ready)
            throw new Error(`Failed to execute 'setup': This screen is already in use.`);

        if (isUndefined(stdin.read))
            throw new Error(`Failed to execute 'setup': The new stdin stream is not readable.`);

        if (isUndefined(stdin.write))
            throw new Error(`Failed to execute 'setup': The new stdout stream is not writable.`);

        if (isUndefined(stdout.columns) || isUndefined(stdout.rows))
            throw new Error(`Failed to execute 'setup': This output stream does not have columns and rows informations.`);

        this.ready = true;

        this.stdin = stdin;
        this.stdout = stdout;

        this.subscription = parseTerminalInputs(this.stdin).subscribe({ next: this.handleInput });
        this.stdout.on(`resize`, this.handleStdoutResize);

        process.on(`exit`, this.handleExit);

        this.style.element.width = this.stdout.columns;
        this.style.element.height = this.stdout.rows;

        this.stdin.setRawMode(true);

        this.stdout.write(screen.reset);
        this.stdout.write(cursor.hide);

        this.handleDirty();

    }

    releaseScreen() {

        if (!this.ready)
            return;

        this.stdout.write(screen.reset);

        this.style.element.width = 0;
        this.style.element.height = 0;

        process.removeListener(`exit`, this.handleExit);

        this.stdout.removeListener(`resize`, this.handleStdoutResize);
        this.subscription = this.subscription.unsubscribe(), null;

        this.stdin = null;
        this.stdout = null;

        this.ready = false;

    }

    scheduleRender() {

        if (this.dirtyTimer)
            return;

        this.dirtyTimer = setImmediate(() => {

            if (!this.ready)
                return;

            this.dirtyTimer = null;
            this.triggerUpdates();

            this.renderScreen(this.flushDirtyRects());

        });

    }

    renderScreen(dirtyRects = [ this.elementClipRect ]) {

        let buffer = cursor.hide;

        let debugColor = DEBUG_COLORS[currentDebugColorIndex];
        currentDebugColorIndex = (currentDebugColorIndex + 1) % DEBUG_COLORS.length;

        while (!isEmpty(dirtyRects)) {

            let dirtyRect = dirtyRects.shift();

            for (let element of this.renderList) {

                if (!element.elementClipRect)
                    continue;

                let intersection = element.elementClipRect.intersect(dirtyRect);

                if (!intersection)
                    continue;

                let truncation = dirtyRect.exclude(intersection);
                dirtyRects = truncation.concat(dirtyRects);

                for (let y = 0, Y = intersection.height; y < Y; ++y) {

                    let relativeX = intersection.x - element.elementWorldRect.x;
                    let relativeY = intersection.y - element.elementWorldRect.y + y ;

                    let line = String(element.renderElement(relativeX, relativeY, intersection.width));

                    if (this.debugPaintRects)
                        line = style.back(debugColor) + line + style.clear;

                    buffer += cursor.moveTo({ x: intersection.x, y: intersection.y + y });
                    buffer += line;

                }

                break;

            }

        }

        if (this.activeElement && this.activeElement.caret) {

            let x = this.activeElement.contentWorldRect.x - this.activeElement.scrollRect.x + this.activeElement.caret.column;
            let y = this.activeElement.contentWorldRect.y - this.activeElement.scrollRect.y + this.activeElement.caret.row;

            if (x >= this.activeElement.contentClipRect.x && x < this.activeElement.contentClipRect.x + this.activeElement.contentClipRect.width && y >= this.activeElement.contentClipRect.y && y < this.activeElement.contentClipRect.y + this.activeElement.contentClipRect.height) {
                buffer += cursor.moveTo({ x, y });
                buffer += cursor.display;
            }

        }

        this.stdout.write(buffer);

    }

    @autobind handleExit() {

        this.releaseScreen();

    }

    @autobind handleDirty() {

        this.scheduleRender();

    }

    @autobind handleCaret(e) {

        if (e.target !== this.activeElement)
            return;

        this.scheduleRender();

    }

    @autobind handleInput(input) {

        if (input instanceof Key) {

            let event = new Event(`keypress`, { bubbles: true });
            event.key = input;

            if (this.activeElement) {
                this.activeElement.dispatchEvent(event);
            } else {
                this.dispatchEvent(event);
            }

        } else if (input instanceof Mouse) {

            let targetElement;

            if (input.start) {

                let event = new Event(`mousedown`, { bubbles: true });
                event.mouse = mouse;

                this.dispatchEvent(event);

            }

            if (input.end) {

                let event = new Event(`mouseup`, { bubbles: true });
                event.mouse = mouse;

                this.dispatchEvent(event);

            }

            if (!input.start && !input.end) {

                let event = new Event(`mousemove`, { bubbles: true });
                event.mouse = mouse;

                this.dispatchEvent(event);

            }

        } else if (input instanceof Buffer) {

            let event = new Event(`data`);
            event.buffer = input;

            if (this.activeElement) {
                this.activeElement.dispatchEvent(event);
            }

        }

    }

    @autobind handleStdoutResize() {

        this.style.element.width = this.stdout.columns;
        this.style.element.height = this.stdout.rows;

    }

}
