export class StyleOverflow {

    constructor({ doesHideOverflow = false } = {}) {

        this.doesHideOverflow = doesHideOverflow;

    }

    serialize() {

        return null;

    }

    inspect() {

        return this.serialize();

    }

}

StyleOverflow.visible = new StyleOverflow();
StyleOverflow.visible.serialize = () => `visible`;

StyleOverflow.hidden = new StyleOverflow({ doesHideOverflow: true });
StyleOverflow.hidden.serialize = () => `hidden`;
