import Yoga from 'yoga-layout';

export class StylePosition {

    constructor({ isPositioned = false, isAbsolutelyPositioned = false } = {}) {

        this.isPositioned = isPositioned;
        this.isAbsolutelyPositioned = isAbsolutelyPositioned;

    }

    serialize() {

        return null;

    }

    inspect() {

        return this.serialize();

    }

}

StylePosition.relative = new StylePosition({ isPositioned: true });
StylePosition.relative.serialize = () => `relative`;
StylePosition.relative.toYoga = () => Yoga.POSITION_TYPE_RELATIVE;

StylePosition.absolute = new StylePosition({ isPositioned: true, isAbsolutelyPositioned: true });
StylePosition.absolute.serialize = () => `absolute`;
StylePosition.absolute.toYoga = () => Yoga.POSITION_TYPE_ABSOLUTE;

StylePosition.fixed = new StylePosition({ isPositioned: true, isAbsolutelyPositioned: true });
StylePosition.fixed.serialize = () => `fixed`;
StylePosition.fixed.toYoga = () => Yoga.POSITION_TYPE_ABSOLUTE;
