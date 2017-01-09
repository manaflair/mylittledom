import { Key, Mouse, parseTerminalInputs } from '@manaflair/term-strings/parse';
import { cursor, feature, screen, style }  from '@manaflair/term-strings';
import { autobind }                        from 'core-decorators';
import { isEmpty, isUndefined, merge }     from 'lodash';
import { Readable, Writable }              from 'stream';

import { Event, Point }                    from '../../core';

import { TermElement }                     from './TermElement';

// We will iterate through those colors when rendering if the debugPaintRects option is set
let DEBUG_COLORS = [ `red`, `green`, `blue`, `magenta`, `yellow` ], currentDebugColorIndex = 0;

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

        // A timer used to trigger layout / clipping / render updates after a node becomes dirty
        this.updateTimer = null;

        // Another timer, this time used to render the dirty part of the screen after they have been computed
        this.renderTimer = null;

        // Bind the listener that will notify us when a node becomes dirty
        this.addEventListener(`dirty`, () => this.scheduleUpdate(), { capture: true });

        // Bind the listeners that will notify us when the caret position changes
        this.addEventListener(`focus`, () => this.scheduleRender(), { capture: true });
        this.addEventListener(`caret`, () => this.scheduleRender(), { capture: true });

        // Bind the listeners that enable navigating between focused elements
        this.addShortcutListener(`S-tab`, e => e.setDefault(() => this.focusPreviousElement()), { capture: true });
        this.addShortcutListener(`tab`, e => e.setDefault(() => this.focusNextElement()), { capture: true });

        // Bind the listener that exit the application on C-c
        this.addShortcutListener(`C-c`, e => this.terminate(), { capture: true });

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

        if (this.stdin.setRawMode)
            this.stdin.setRawMode(true);

        this.stdout.write(screen.reset);
        this.stdout.write(cursor.hidden);

        this.stdout.write(feature.enableMouseHoldTracking.in);
        this.stdout.write(feature.enableExtendedCoordinates.in);

        this.scheduleUpdate();

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

    terminate() {

        if (typeof process === `undefined`)
            return;

        if (typeof process.exit === `undefined`)
            return;

        process.exit(0);

    }

    queueDirtyRect(... args) {

        this.scheduleRender();

        return super.queueDirtyRect(... args);

    }

    scheduleUpdate() {

        if (this.updateTimer)
            return;

        this.updateTimer = setImmediate(() => {

            if (!this.ready)
                return;

            this.updateTimer = null;
            this.triggerUpdates();

        });

    }

    scheduleRender() {

        if (this.renderTimer)
            return;

        this.renderTimer = setImmediate(() => {

            if (!this.ready)
                return;

            this.renderTimer = null;
            this.renderScreen(this.flushDirtyRects());

        });

    }

    getElementAt(position) {

        this.triggerUpdates();

        let { x, y } = position;

        for (let element of this.renderList) {

            if (!element.elementClipRect)
                continue;

            if (x < element.elementClipRect.x || x >= element.elementClipRect.x + element.elementClipRect.width)
                continue;

            if (y < element.elementClipRect.y || y >= element.elementClipRect.y + element.elementClipRect.height)
                continue;

            return element;

        }

        return null;

    }

    renderScreen(dirtyRects = [ this.elementClipRect ]) {

        this.triggerUpdates();

        let buffer = cursor.hidden;

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
                        line = style.color.back(debugColor).in + line + style.clear;

                    buffer += cursor.moveTo({ x: intersection.x, y: intersection.y + y });
                    buffer += line;

                }

                break;

            }

        }

        if (this.activeElement && this.activeElement.contentClipRect && this.activeElement.caret) {

            let x = this.activeElement.contentWorldRect.x - this.activeElement.scrollRect.x + this.activeElement.caret.x;
            let y = this.activeElement.contentWorldRect.y - this.activeElement.scrollRect.y + this.activeElement.caret.y;

            if (x >= this.activeElement.contentClipRect.x && x < this.activeElement.contentClipRect.x + this.activeElement.contentClipRect.width && y >= this.activeElement.contentClipRect.y && y < this.activeElement.contentClipRect.y + this.activeElement.contentClipRect.height) {
                buffer += cursor.moveTo({ x, y });
                buffer += cursor.normal;
            }

        }

        this.stdout.write(buffer);

    }

    @autobind handleExit() {

        this.releaseScreen();

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

            let worldCoordinates = new Point({ x: input.x, y: input.y });

            let targetElement = this.getElementAt(worldCoordinates);

            let contentCoordinates = new Point({ x: worldCoordinates.x - targetElement.contentWorldRect.x, y: worldCoordinates.y - targetElement.contentWorldRect.y + targetElement.scrollTop });

            if (input.start) {

                let event = new Event(`mousedown`, { bubbles: true });
                event.mouse = input;

                event.worldCoordinates = worldCoordinates;
                event.contentCoordinates = contentCoordinates;

                targetElement.dispatchEvent(event);

            }

            if (input.end) {

                let event = new Event(`mouseup`, { bubbles: true });
                event.mouse = input;

                event.worldCoordinates = worldCoordinates;
                event.contentCoordinates = contentCoordinates;

                targetElement.dispatchEvent(event);

            }

            if (!input.start && !input.end) {

                let event = new Event(`mousemove`, { bubbles: true });
                event.mouse = input;

                event.worldCoordinates = worldCoordinates;
                event.contentCoordinates = contentCoordinates;

                targetElement.dispatchEvent(event);

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
