export class Rect {

    static getBoundingRect(... rects) {

        let output = null;

        for (let rect of rects) {

            if (!rect || rect.isEmpty())
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

    static areEqual(a, b) {

        if (a === b)
            return true;

        if (a === null || b === null)
            return false;

        return a.equals(b);

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

    setFrom(other) {

        this.x = other.x;
        this.y = other.y;

        this.width = other.width;
        this.height = other.height;

        return this;

    }

    isEmpty() {

        return this.width === 0 || this.height === 0;

    }

    equals(other) {

        return (

            other !== null &&

            other.x === this.x &&
            other.y === this.y &&

            other.width === this.width &&
            other.height === this.height

        );

    }

    doesContain(other) {

        return (

            other !== null &&

            other.x >= this.x &&
            other.y >= this.y &&

            other.x + other.width <= this.x + this.width &&
            other.y + other.height <= this.y + this.height

        );

    }

    doesIntersect(other) {

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

    exclude(other) {

        if (!this.width || !this.height)
            return [];

        let intersection = this.intersect(other);

        if (!intersection)
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

    intersect(other) {

        if (!this.doesIntersect(other))
            return null;

        if (other === this)
            return this.clone();

        let rect = new Rect();

        rect.x = Math.max(this.x, other.x);
        rect.y = Math.max(this.y, other.y);

        rect.width = Math.min(this.x + this.width, other.x + other.width) - rect.x;
        rect.height = Math.min(this.y + this.height, other.y + other.height) - rect.y;

        return rect;

    }

    union(other) {

        let rect = new Rect();

        rect.x = Math.min(this.x, other.x);
        rect.y = Math.min(this.y, other.y);

        rect.width = Math.max(this.x + this.width, other.x + other.width) - rect.x;
        rect.height = Math.max(this.y + this.height, other.y + other.height) - rect.y;

        return rect;

    }

    toString() {

        return `<Rect#x: ${this.x} y: ${this.y} | w: ${this.width} h: ${this.height}>`;

    }

}
