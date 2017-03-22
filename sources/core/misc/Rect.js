import { Point } from './Point';

export class Rect {

    static isEmpty(rect) {

        return (

            rect === null ||

            rect.width === 0 ||
            rect.height === 0

        );

    }

    static getBoundingRect(... rects) {

        let output = null;

        for (let rect of rects) {

            if (Rect.isEmpty(rect))
                continue;

            if (!output) {

                output = rect.clone();

            } else {

                if (rect.x < output.x) {
                    output.width += output.x - rect.x;
                    output.x = rect.x;
                }

                if (rect.y < output.y) {
                    output.height += output.y - rect.y;
                    output.y = rect.y;
                }

                if (rect.x + rect.width > output.x + output.width)
                    output.width += rect.x + rect.width - output.x - output.width;

                if (rect.y + rect.height > output.y + output.height) {
                    output.height += rect.y + rect.height - output.y - output.height;
                }

            }

        }

        return output;

    }

    static getIntersectingRect(... rects) {

        let output = null;

        for (let rect of rects) {

            if (Rect.isEmpty(rect))
                return null;

            if (!output) {

                output = rect.clone();

            } else if (!output.intersectsRect(rect)) {

                return null;

            } else {

                let x = Math.max(output.x, rect.x);
                let y = Math.max(output.y, rect.y);

                output.width = Math.min(output.x + output.width, rect.x + rect.width) - x;
                output.height = Math.min(output.y + output.height, rect.y + rect.height) - y;

                output.x = x;
                output.y = y;

            }

        }

        return output;

    }

    static areEqual(a, b) {

        if (a === b)
            return true;

        if (Rect.isEmpty(a))
            return Rect.isEmpty(b);

        if (Rect.isEmpty(b))
            return Rect.isEmpty(a);

        return (

            a.x === b.x &&
            a.y === b.y &&

            a.width === b.width &&
            a.height === b.height

        );

    }

    constructor({ x = 0, y = 0, width = 0, height = 0 } = {}) {

        this.x = x;
        this.y = y;

        this.width = width;
        this.height = height;

    }

    clone() {

        return new Rect(this);

    }

    assign(other) {

        this.x = other.x;
        this.y = other.y;

        this.width = other.width;
        this.height = other.height;

        return this;

    }

    includesPoint(point) {

        return (

            point.x >= this.x &&
            point.y >= this.y &&

            point.x < this.x + this.width &&
            point.y < this.y + this.height

        );

    }

    includesRect(other) {

        return (

            other !== null &&

            other.x >= this.x &&
            other.y >= this.y &&

            other.x + other.width <= this.x + this.width &&
            other.y + other.height <= this.y + this.height

        );

    }

    intersectsRect(other) {

        return (

            other !== null &&

            other.x < this.x + this.width &&
            other.x + other.width > this.x &&

            other.y < this.y + this.height &&
            other.y + other.height > this.y &&

            this.width > 0 && this.height > 0 &&
            other.width > 0 && other.height > 0

        );

    }

    excludeRect(other) {

        if (Rect.isEmpty(this))
            return [];

        let intersection = Rect.getIntersectingRect(this, other);

        if (Rect.isEmpty(intersection))
            return [ this.clone() ];

        let results = [];

        if (intersection.x > this.x) {

            let slice = new Rect();
            results.push(slice);

            slice.x = this.x;
            slice.y = intersection.y;

            slice.width = intersection.x - this.x;
            slice.height = intersection.height;

        }

        if (intersection.x + intersection.width < this.x + this.width) {

            let slice = new Rect();
            results.push(slice);

            slice.x = intersection.x + intersection.width;
            slice.y = intersection.y;

            slice.width = this.x + this.width - intersection.x - intersection.width;
            slice.height = intersection.height;

        }

        if (intersection.y > this.y) {

            let slice = new Rect();
            results.push(slice);

            slice.x = this.x;
            slice.y = this.y;

            slice.width = this.width;
            slice.height = intersection.y - this.y;

        }

        if (intersection.y + intersection.height < this.y + this.height) {

            let slice = new Rect();
            results.push(slice);

            slice.x = this.x;
            slice.y = intersection.y + intersection.height;

            slice.width = this.width;
            slice.height = this.y + this.height - intersection.y - intersection.height;

        }

        return results;

    }

    getDistanceFromPoint(point) {

        let distance = new Point();

        if (point.x < this.x)
            distance.x = this.x - point.x;
        else if (point.x >= this.x + this.width)
            distance.x = this.x + this.width - point.x + 1;

        if (point.y < this.y)
            distance.y = this.y - point.y;
        else if (point.y >= this.y + this.height)
            distance.y = this.y + this.height - point.y + 1;

        return distance;

    }

    get barycenter() {

        if (Rect.isEmpty(this))
            return null;

        let point = new Point();

        point.x = this.x + this.width / 2;
        point.y = this.y + this.height / 2;

        return point;

    }

    toString() {

        return `<Rect#x: ${this.x} y: ${this.y} | w: ${this.width} h: ${this.height}>`;

    }

}
