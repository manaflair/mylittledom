import { moveTo, reset, style }        from '@manaflair/term-strings';
import { autobind }                    from 'core-decorators';
import { isEmpty, isUndefined, merge } from 'lodash';
import { Readable, Writable }          from 'stream';

import { TermElement }                 from './TermElement';

// We will iterate through those colors when rendering if the debugPaintRects option is set
let DEBUG_COLORS = [ `red`, `green`, `blue`, `magenta` ], currentDebugColorIndex = 0;

export class TermScreen extends TermElement {

    constructor({ ... props } = {}) {

        super(merge({ style: { position: `relative` } }, props));

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

        // A setImmediate timer used to trigger a rerender after the node becomes dirty
        this.dirtyTimer = null;

        // Bind the listener that will notify us when the node becomes dirty
        this.addEventListener(`dirty`, this.handleDirty);

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

        this.stdin.on(`keypress`, this.handleStdinKey);
        this.stdin.on(`mousepress`, this.handleStdinMouse);

        this.stdout.on(`resize`, this.handleStdoutResize);

        process.on(`exit`, this.handleExit);

        this.style.width = this.stdout.columns;
        this.style.height = this.stdout.rows;

        this.stdin.setRawMode(true);

        this.stdout.write(reset);
        this.stdout.write(style.cursor.hidden);

        this.handleDirty();

    }

    releaseScreen() {

        if (!this.ready)
            return;

        this.stdout.write(reset);

        this.style.width = 0;
        this.style.height = 0;

        process.removeListener(`exit`, this.handleExit);

        this.stdout.removeListener(`resize`, this.handleStdoutResize);

        this.stdin.removeListener(`keypress`, this.handleStdinKey);
        this.stdin.removeListener(`mousepress`, this.handleStdinMouse);

        this.stdin = null;
        this.stdout = null;

        this.ready = false;

    }

    renderScreen(dirtyRects = [ this.clipRect ]) {

        let buffer = style.cursor.hidden;

        let debugColor = DEBUG_COLORS[currentDebugColorIndex];
        currentDebugColorIndex = (currentDebugColorIndex + 1) % DEBUG_COLORS.length;

        while (!isEmpty(dirtyRects)) {

            let dirtyRect = dirtyRects.shift();

            for (let element of this.renderList) {

                if (!element.clipRect)
                    continue;

                let intersection = element.clipRect.intersect(dirtyRect);

                if (!intersection)
                    continue;

                let truncation = dirtyRect.exclude(intersection);
                dirtyRects = truncation.concat(dirtyRects);

                for (let y = 0, Y = intersection.height; y < Y; ++y) {

                    let relativeX = intersection.x - element.worldRect.x;
                    let relativeY = intersection.y - element.worldRect.y + y ;

                    let line = String(element.renderElement(relativeX, relativeY, intersection.width));

                    if (this.props.debugPaintRects)
                        line = style.back(debugColor) + line + style.clear;

                    buffer += moveTo({ x: intersection.x, y: intersection.y + y });
                    buffer += line;

                }

                break;

            }

        }

        if (this.activeElement && this.activeElement.caret) {

            let activeElement = this.activeElement;

            let x = activeElement.worldRect.x + activeElement.contentRect.x + activeElement.caret.x;
            let y = activeElement.worldRect.y + activeElement.contentRect.y + activeElement.caret.y;

            buffer += moveTo({ x, y });
            buffer += style.cursor.normal;

        }

        this.stdout.write(buffer);

    }

    @autobind handleExit() {

        this.releaseScreen();

    }

    @autobind handleDirty() {

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

    @autobind handleStdinKey() {

    }

    @autobind handleStdinMouse() {

    }

    @autobind handleStdoutResize() {

        this.style.width = this.stdout.columns;
        this.style.height = this.stdout.rows;

    }

}
