import { pick } from 'lodash';

export class StylePosition {

    constructor({ isPositioned = false, isAbsolutelyPositioned = false } = {}) {

        this.isPositioned = isPositioned;
        this.isAbsolutelyPositioned = isAbsolutelyPositioned;

    }

    serialize() {

        return `unnamed`;

    }

    inspect() {

        return this.serialize();

    }

}

StylePosition.static = new StylePosition({});
StylePosition.static.serialize = () => `static`;

StylePosition.relative = new StylePosition({ isPositioned: true });
StylePosition.relative.serialize = () => `relative`;

StylePosition.absolute = new StylePosition({ isPositioned: true, isAbsolutelyPositioned: true });
StylePosition.absolute.serialize = () => `absolute`;

StylePosition.fixed = new StylePosition({ isPositioned: true, isAbsolutelyPositioned: true });
StylePosition.fixed.serialize = () => `fixed`;

StylePosition.values = pick(StylePosition, [ `static`, `relative`, `absolute`, `fixed` ]);
