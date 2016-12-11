export class Point {

    constructor({ column = 0, row = 0, x = column, y = row } = {}) {

        this.x = x;
        this.y = y;

    }

    get column() {

        return this.x;

    }

    get row() {

        return this.y;

    }

    set column(column) {

        this.x = column;

    }

    set row(row) {

        this.y = row;

    }

    clone() {

        return new Point(this);

    }

    toString() {

        return `<Point#x: ${this.x} y: ${this.y}>`;

    }

}
