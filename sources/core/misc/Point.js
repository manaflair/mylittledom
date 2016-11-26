export class Point {

    constructor({ x = 0, y = 0 } = {}) {

        this.x = x;
        this.y = y;

    }

    clone() {

        return new Point(this);

    }

    toString() {

        return `<Point#x: ${this.x} y: ${this.y}>`;

    }

}
