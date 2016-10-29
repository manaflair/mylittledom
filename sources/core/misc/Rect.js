import { isNil } from 'lodash';

export class Rect {

    static fromJS({ top, bottom, left, right, width, height } = {}) {

        let rect = new this();

        if (!isNil(left))
            rect.left = left;

        if (!isNil(right))
            rect.right = right;

        if (!isNil(top))
            rect.top = top;

        if (!isNil(bottom))
            rect.bottom = bottom;

        if (!isNil(width))
            rect.width = width;

        if (!isNil(height))
            rect.height = height;

        return rect;

    }

    constructor(other) {

        if (other instanceof Rect) {

            this.copySelf(other);

        } else {

            this.top = this.bottom = 0;
            this.left = this.right = 0;

            this.width = this.height = null;

        }

    }

    copySelf(other) {

        this.left = other.left;
        this.right = other.right;

        this.top = other.top;
        this.bottom = other.bottom;

        this.width = other.width;
        this.height = other.height;

    }

    contractSelf(top, right, bottom, left) {

        this.top += top;
        this.bottom += bottom;

        this.left += left;
        this.right += right;

        this.width -= left + right;
        this.height -= top + bottom;

        this.width = Math.max(0, this.width);
        this.height = Math.max(0, this.height);

    }

    setOriginSelf(top, right, bottom, left) {

        this.top += top;
        this.bottom += bottom;

        this.left += left;
        this.right += right;

    }

    isValid() {

        return !isNaN(this.width) && !isNaN(this.height);

    }

    contains(other) {

        return other.left >= this.left
            && other.top >= this.top
            && other.left + other.width <= this.left + this.width
            && other.top + other.height <= this.top + this.height;

    }

    exclude(other) {

        if (!this.width || !this.height)
            return [];

        let intersection = this.intersection(other);

        if (!intersection)
            return [ new Rect(this) ];

        let workingRect = new Rect(this);
        let results = [], tmp;

        if (intersection.left > this.left) {

            results.push(tmp = new Rect());

            tmp.left = this.left;
            tmp.right = intersection.right + intersection.width;

            tmp.top = intersection.top;
            tmp.bottom = intersection.bottom;

            tmp.width = intersection.left - this.left;
            tmp.height = intersection.height;

        }

        if (intersection.left + intersection.width < this.left + this.width) {

            results.push(tmp = new Rect());

            tmp.left = intersection.left + intersection.width;
            tmp.right = this.right;

            tmp.top = intersection.top;
            tmp.bottom = intersection.bottom;

            tmp.width = this.left + this.width - intersection.left - intersection.width;
            tmp.height = intersection.height;

        }

        if (intersection.top > this.top) {

            results.push(tmp = new Rect());

            tmp.left = this.left;
            tmp.right = this.right;

            tmp.top = this.top;
            tmp.bottom = intersection.bottom + intersection.height;

            tmp.width = this.width;
            tmp.height = intersection.top - this.top;

        }

        if (intersection.top + intersection.height < this.top + this.height) {

            results.push(tmp = new Rect());

            tmp.left = this.left;
            tmp.right = this.right;

            tmp.top = intersection.top + intersection.height;
            tmp.bottom = this.bottom;

            tmp.width = this.width;
            tmp.height = this.top + this.height - intersection.top - intersection.height;

        }

        return results;

    }

    intersection(other) {

        let doesIntersect =

            other.left < this.left + this.width &&
            other.left + other.width > this.left &&

            other.top < this.top + this.height &&
            other.top + other.height > this.top &&

            this.width > 0 && this.height > 0 &&
            other.width > 0 && other.height > 0;

        if (!doesIntersect)
            return false;

        let rect = new Rect();

        rect.left = Math.max(this.left, other.left);
        rect.top = Math.max(this.top, other.top);

        rect.width = Math.min(this.left + this.width, other.left + other.width) - rect.left;
        rect.height = Math.min(this.top + this.height, other.top + other.height) - rect.top;

        rect.right = Math.min(this.right + this.width, other.right + other.width) - rect.width;
        rect.bottom = Math.min(this.bottom + this.height, other.bottom + other.height) - rect.height;

        return rect;

    }

    toString() {

        return `<Rect#l: ${this.left} r: ${this.right} | t: ${this.top} b: ${this.bottom} | w: ${this.width} h: ${this.height}>`;

    }

}
