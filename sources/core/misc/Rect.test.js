import { expect } from 'chai';

import { Rect }   from './Rect';

describe(`Rect`, () => {

    describe(`.getBoundingRect`, () => {

        it(`should merge together two rects`, () => {

            let rectA = new Rect({ x: 0, y: 0, width: 10, height: 10 });
            let rectB = new Rect({ x: 20, y: 20, width: 10, height: 10 });

            let merge = Rect.getBoundingRect(rectA, rectB);

            expect(merge).to.deep.equal(new Rect({ x: 0, y: 0, width: 30, height: 30 }));

        });

        it(`should merge together more than two rects`, () => {

            let rects = [];

            for (let t = 0; t < 10; ++t)
                rects.push(new Rect({ x: t * 10, y: t * 10, width: 10, height: 10 }));

            let merge = Rect.getBoundingRect(... rects);

            expect(merge).to.deep.equal(new Rect({ x: 0, y: 0, width: 100, height: 100 }));

        });

        it(`should ignore null rects`, () => {

            let rects = [];

            for (let t = 0; t < 10; ++t)
                rects.push(t % 2 ? new Rect({ x: t * 10, y: t * 10, width: 10, height: 10 }) : null);

            let merge = Rect.getBoundingRect(... rects);

            expect(merge).to.deep.equal(new Rect({ x: 10, y: 10, width: 90, height: 90 }));

        });

        it(`should return null if all rects are null`, () => {

            let merge = Rect.getBoundingRect(null, null, null);

            expect(merge).to.equal(null);

        });

    });

});
