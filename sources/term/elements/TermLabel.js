import { Event, findDescendantByPredicate } from './../../core';

import { TermElement }                      from './TermElement';

export class TermLabel extends TermElement {

    constructor(props) {

        super(props);

        this.addEventListener(`mousedown`, e => {

            e.setDefault(() => {

                let target = findDescendantByPredicate(e.currentTarget, node => node.style.$.focusEvents);

                if (!target)
                    return;

                target.dispatchEvent(Object.assign(new Event(`mousedown`), { mouse: { name: `left` } }));
                target.dispatchEvent(Object.assign(new Event(`mouseup`), { mouse: { name: `left` } }));

            });

        });

    }

}
