export class Point {

    constructor({ column = 0, row = 0, x = column, y = row } = {}) {

        this.x = x;
        this.y = y;

    }

    clone() {

        return new Point(this);

    }

    assign(other) {

        this.x = other.x;
        this.y = other.y;

        return this;

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

    get length() {

        return Math.sqrt(this.x * this.x + this.y * this.y);

    }

    toString() {

        return `<Point#x: ${this.x} y: ${this.y}>`;

    }

}
