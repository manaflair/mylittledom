export class StyleLength {

    constructor(size = 0, isRelative = false) {

        this.size = size;
        this.isRelative = isRelative;

    }

    resolve(relativeTo) {

        if (this.isRelative) {
            return this.size * relativeTo / 100;
        } else {
            return this.size;
        }

    }

    serialize() {

        if (this.isRelative) {
            return `${this.size}%`;
        } else {
            return this.size;
        }

    }

    toYoga() {

        return this.serialize();

    }

    valueOf() {

        return this.size;

    }

    inspect() {

        return this.serialize();

    }

}

StyleLength.autoNaN = new StyleLength();
StyleLength.autoNaN.toYoga = () => NaN;
StyleLength.autoNaN.serialize = () => `auto`;

StyleLength.auto = new StyleLength();
StyleLength.auto.serialize = () => `auto`;

StyleLength.infinity = new StyleLength(Infinity);
