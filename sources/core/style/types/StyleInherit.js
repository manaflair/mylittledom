export class StyleInherit {

    constructor() {

    }

    serialize() {

        return null;

    }

    inspect() {

        return this.serialize();

    }

}

StyleInherit.inherit = new StyleInherit();
StyleInherit.inherit.serialize = () => `inherit`;
