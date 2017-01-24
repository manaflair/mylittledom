import { style }       from '@manaflair/term-strings';
import { isNumber }    from 'lodash';

import { TermElement } from './TermElement';

export class TermScrollbar extends TermElement {

    constructor({ direction = null, viewportSize = 0, innerSize = 0, position = 0, ... props } = {}) {

        super({ ... props });

        this.setPropertyTrigger(`direction`, direction, {

            validate: value => {

                return value === `horizontal` || value === `vertical`;

            },

            trigger: () => {

                this.queueDirtyRect();

            }

        });

        this.setPropertyTrigger(`viewportSize`, viewportSize, {

            validate: value => {

                return isNumber(value);

            },

            trigger: () => {

                this.queueDirtyRect();

            }

        });

        this.setPropertyTrigger(`innerSize`, innerSize, {

            validate: value => {

                return isNumber(value);

            },

            trigger: () => {

                this.queueDirtyRect();

            }

        });

        this.setPropertyTrigger(`position`, position, {

            validate: value => {

                return isNumber(value);

            },

            trigger: () => {

                this.queueDirtyRect();

            }

        });

    }

    renderContent(x, y, l) {

        switch (this.direction) {

            case `horizontal`: {

                let output = ``;

                let cursorSize = Math.floor(this.elementRect.width * Math.max(0, Math.min(this.viewportSize / this.innerSize, 1)));
                let cursorPosition = Math.round((this.elementRect.width - cursorSize) * (this.position / (this.innerSize - this.viewportSize)));

                let prefixLength = Math.max(0, Math.min(cursorPosition - x, l));
                let cursorLength = Math.max(0, Math.min(cursorSize - Math.max(0, x - cursorPosition), l - prefixLength));
                let suffixLength = l - prefixLength - cursorLength;

                output += this.renderBackground(prefixLength);
                output += this.style.$.color.back + ` `.repeat(cursorLength) + style.clear;
                output += this.renderBackground(suffixLength);

                return output;

            } break;

            case `vertical`: {

                if (this.viewportSize === 0 || this.innerSize === 0)
                    return this.renderBackground(l);

                let cursorSize = Math.floor(this.elementRect.height * Math.max(0, Math.min(this.viewportSize / this.innerSize, 1)));
                let cursorPosition = Math.round((this.elementRect.height - cursorSize) * (this.position / (this.innerSize - this.viewportSize)));

                if (y >= cursorPosition && y < cursorPosition + cursorSize) {
                    return this.style.$.color.back + ` `.repeat(l) + style.clear;
                } else {
                    return this.renderBackground(l);
                }

            } break;

        }

    }

}
