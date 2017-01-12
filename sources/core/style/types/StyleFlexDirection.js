import Yoga from 'yoga-layout';

export class StyleFlexDirection {

    serialize() {

        return null;

    }

    inspect() {

        return this.serialize();

    }

}

StyleFlexDirection.row = new StyleFlexDirection();
StyleFlexDirection.row.serialize = () => `row`;
StyleFlexDirection.row.toYoga = () => Yoga.FLEX_DIRECTION_ROW;

StyleFlexDirection.rowReverse = new StyleFlexDirection();
StyleFlexDirection.rowReverse.serialize = () => `rowReverse`;
StyleFlexDirection.rowReverse.toYoga = () => Yoga.FLEX_DIRECTION_ROW_REVERSE;

StyleFlexDirection.column = new StyleFlexDirection();
StyleFlexDirection.column.serialize = () => `column`;
StyleFlexDirection.column.toYoga = () => Yoga.FLEX_DIRECTION_COLUMN;

StyleFlexDirection.columnReverse = new StyleFlexDirection();
StyleFlexDirection.columnReverse.serialize = () => `columnReverse`;
StyleFlexDirection.columnReverse.toYoga = () => Yoga.FLEX_DIRECTION_COLUMN_REVERSE;
