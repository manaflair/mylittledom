import { isBoolean }                                          from 'lodash';

import { StyleManager, makeRuleset, findAncestorByPredicate } from '../../core';

import { TermForm }                                           from './TermForm';
import { TermText }                                           from './TermText';

export class TermButton extends TermText {

    constructor({ submit = false, ... props }) {

        super({ ... props });

        this.styleManager.addRuleset(makeRuleset({

            focusEvents: true

        }, `:decored:hover`, {

            borderColor: `white`,
            color: `white`,

            textDecoration: `underline`

        }, `:decored:focus`, {

            borderColor: `white`,
            color: `white`,

            textDecoration: `underline`

        }, `:decored:active`, {

            backgroundClip: `paddingBox`,
            backgroundColor: `white`,

            color: `black`,

            textDecoration: null

        }), StyleManager.RULESET_NATIVE);

        let submitForm = () => {

            let form = findAncestorByPredicate(this, node => node instanceof TermForm);

            if (!form)
                return;

            let event = new Event(`submit`, { cancelable: true });

            form.dispatchEvent(event);

        };

        this.addEventListener(`click`, e => {

            if (!this.doesSubmit)
                return;

            e.setDefault(() => {
                submitForm();
            });

        }, { capture: true });

        this.addShortcutListener(`enter`, e => {

            if (!this.doesSubmit)
                return;

            e.setDefault(() => {
                submitForm();
            });

        }, { capture: true });

        this.setPropertyTrigger(`submit`, submit, {

            validate: value => {

                return isBoolean(value);

            }

        });

    }

}
