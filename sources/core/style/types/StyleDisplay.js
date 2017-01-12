import { BlockLayout } from '../../layout/BlockLayout';

export class StyleDisplay {

    constructor() {

    }

    serialize() {

        return null;

    }

    inspect() {

        return this.serialize();

    }

}

StyleDisplay.flex = new StyleDisplay(`flex`);
StyleDisplay.flex.serialize = () => `flex`;
