export class StyleOverflowWrap {

    constructor({ doesBreakWords = false } = {}) {

        this.doesBreakWords = doesBreakWords;

    }

    serialize() {

        return null;

    }

    inspect() {

        return this.serialize();

    }

}

StyleOverflowWrap.normal = new StyleOverflowWrap();
StyleOverflowWrap.normal.serialize = () => `normal`;

StyleOverflowWrap.breakWord = new StyleOverflowWrap({ doesBreakWords: true });
StyleOverflowWrap.breakWord.serialize = () => `breakWord`;
