export class StyleOverflow {

    serialize() {

        return null;

    }

    inspect() {

        return this.serialize();

    }

}

StyleOverflow.visible = new StyleOverflow();
StyleOverflow.visible.serialize = () => `visible`;

StyleOverflow.hidden = new StyleOverflow();
StyleOverflow.hidden.serialize = () => `hidden`;
