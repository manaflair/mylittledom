export class StylePosition {

    constructor(name, { isPositioned = false, isAbsolutelyPositioned = false } = {}) {

        this.name = name;

        this.isPositioned = isPositioned;
        this.isAbsolutelyPositioned = isAbsolutelyPositioned;

    }

    serialize() {

        return this.name;

    }

    inspect() {

        return this.serialize();

    }

}

StylePosition.static = new StylePosition(`static`);
StylePosition.relative = new StylePosition(`relative`, { isPositioned: true });
StylePosition.absolute = new StylePosition(`absolute`, { isPositioned: true, isAbsolutelyPositioned: true });
StylePosition.fixed = new StylePosition(`fixed`, { isPositioned: true, isAbsolutelyPositioned: true });
