import { BlockLayout } from '../../layout/BlockLayout';

export class StyleDisplay {

    constructor(name, layout = null) {

        this.name = name;

        this.layout = layout;

    }

    serialize() {

        return this.name;

    }

    inspect() {

        return this.serialize();

    }

}

StyleDisplay.block = new StyleDisplay(`block`, BlockLayout);
