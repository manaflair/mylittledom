export class StyleOverflow {

    constructor(name) {

        this.name = name;

    }

    serialize() {

        return this.name;

    }

    inspect() {

        return this.serialize();

    }

}

StyleOverflow.visible = new StyleOverflow(`visible`);
StyleOverflow.hidden = new StyleOverflow(`hidden`);
