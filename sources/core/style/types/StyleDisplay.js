export class StyleDisplay {

    serialize() {

        return null;

    }

    inspect() {

        return this.serialize();

    }

}

StyleDisplay.flex = new StyleDisplay();
StyleDisplay.flex.serialize = () => `flex`;
