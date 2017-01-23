import { Event, findDescendantByPredicate, isChildOf } from './../../core';

import { TermElement }                                 from './TermElement';

export class TermLabel extends TermElement {

    constructor(props) {

        super(props);

        this.addEventListener(`click`, e => {

            e.setDefault(() => {

                let labelTarget = findDescendantByPredicate(e.currentTarget, node => node.style.$.focusEvents);

                if (!labelTarget)
                    return;

                if (e.target === labelTarget || isChildOf(e.target, labelTarget))
                    return;

                labelTarget.focus();
                labelTarget.click(e.mouse);

            });

        }, { capture: true });

    }

}
