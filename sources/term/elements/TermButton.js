import { StyleManager, makeRuleset } from '../../core';

import { TermText }                  from './TermText';

export class TermButton extends TermText {

    constructor({ ... props }) {

        super({ ... props });

        this.styleManager.addRuleset(makeRuleset({

            focusEvents: true

        }, `:hover`, {

            borderColor: `white`,
            color: `white`,

            textDecoration: `underline`

        }, `:active`, {

            backgroundClip: `paddingBox`,
            backgroundColor: `white`,

            color: `black`,

            textDecoration: null

        }), StyleManager.RULESET_NATIVE);

    }

}
