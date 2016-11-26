export class StyleOverflowWrap {

    constructor(name, { doesBreakWords = false } = {}) {

        this.name = name;

        this.doesBreakWords = doesBreakWords;

    }

    serialize() {

        return this.name;

    }

    inspect() {

        return this.serialize();

    }

}

StyleOverflowWrap.normal = new StyleOverflowWrap(`normal`);
StyleOverflowWrap.breakWord = new StyleOverflowWrap(`breakWord`, { doesBreakWords: true });
