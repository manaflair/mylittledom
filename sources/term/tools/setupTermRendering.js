import { moveTo, reset, style } from '@manaflair/term-strings';
import { isEmpty }              from 'lodash';

import { TermScreen }           from '../elements/TermScreen';

let debugColors = [ `red`, `green`, `blue`, `magenta` ], currentDebugColorIndex = 0;
let invalidUtf8Symbols = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/;

export function setupTermRendering(screen, { stdin = process.stdin, stdout = process.stdout, resetOnExit = true } = {}) {

    if (!(screen instanceof TermScreen))
        throw new Error(`Failed to execute 'setupTermRendering': Parameter 1 is not of type 'TermScreen'.`);

    let relayoutTimer = null;

    let resizeScreen = () => {

        screen.style.width = stdout.columns;
        screen.style.height = stdout.rows;

    };

    let relayoutTree = (forceFullRepaint = true) => {

        let dirtyRects = screen.triggerLayout();

        if (forceFullRepaint)
            dirtyRects = [ screen.clipRect ];

        redrawRects(dirtyRects);

    };

    let deferRelayout = () => {

        if (relayoutTimer)
            return;

        relayoutTimer = setImmediate(() => {
            relayoutTree(false);
        });

    };

    let redrawRects = (rects) => {

        let buffer = style.cursor.hidden;

        let debugColor = debugColors[currentDebugColorIndex];
        currentDebugColorIndex = (currentDebugColorIndex + 1) % debugColors.length;

        while (!isEmpty(rects)) {

            let rect = rects.shift();

            for (let element of screen.renderList) {

                let intersection = element.clipRect.intersect(rect);

                if (!intersection)
                    continue;

                let truncation = rect.exclude(intersection);
                rects = truncation.concat(rects);

                for (let y = 0, Y = intersection.height; y < Y; ++y) {

                    let relativeX = intersection.x - element.worldRect.x;
                    let relativeY = intersection.y - element.worldRect.y + y ;

                    let line = String(element.renderElement(relativeX, relativeY, intersection.width));

                    if (process.env.OHUI_DEBUG_RENDER)
                        line = style.back(debugColor) + line + style.clear;

                    buffer += moveTo({ x: intersection.x, y: intersection.y + y });
                    buffer += line;

                }

                break;

            }

        }

        if (screen.activeElement && screen.activeElement.caret) {

            let activeElement = screen.activeElement;

            let x = activeElement.worldRect.x + activeElement.contentRect.x + activeElement.caret.x;
            let y = activeElement.worldRect.y + activeElement.contentRect.y + activeElement.caret.y;

            buffer += moveTo({ x, y });
            buffer += style.cursor.normal;

        }

        stdout.write(buffer);

    };

    let resetTerminal = () => {

        stdout.write(reset);

    };

    let exitProcess = () => {

        process.exit();

    };

    stdin.setRawMode(true);

    stdout.write(reset);
    stdout.write(style.cursor.hidden);

    process.on(`exit`, resetTerminal);
    stdin.on(`data`, exitProcess);
    stdin.on(`mousepress`, exitProcess);
    stdout.on(`resize`, resizeScreen);
    screen.on(`dirty`, deferRelayout);

    resizeScreen();
    relayoutTree();

}
