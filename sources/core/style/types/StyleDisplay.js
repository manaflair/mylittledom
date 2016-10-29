import { pick }        from 'lodash';

import { BlockLayout } from '../../layout/BlockLayout';

export class StyleDisplay {

    constructor(layout = null) {

        this.layout = layout;

    }

    serialize() {

        return `unnamed`;

    }

    inspect() {

        return this.serialize();

    }

}

StyleDisplay.block = new StyleDisplay(BlockLayout);
StyleDisplay.block.serialize = () => `block`;

StyleDisplay.values = pick(StyleDisplay, [ `block` ]);
