import { expect }                              from 'chai';

import { StyleDisplay }                        from '../style/types/StyleDisplay';
import { StylePosition }                       from '../style/types/StylePosition';

import { Element }                             from './Element';

describe(`Element`, () => {

    describe(`#style`, () => {

        it(`should start with default values`, () => {

            let element = new Element();

            expect(element.style.display).to.equal(`block`);

        });

        it(`should accept valid property values`, () => {

            let element = new Element();

            element.style.display = null;
            expect(element.style.display).to.equal(null);

            element.style.display = `block`;
            expect(element.style.display).to.equal(`block`);

            element.style.left = 100;
            expect(element.style.left).to.equal(100);

            element.style.left = `100`;
            expect(element.style.left).to.equal(100);

            element.style.left = `100%`;
            expect(element.style.left).to.equal(`100%`);

            element.style.left = `auto`;
            expect(element.style.left).to.equal(`auto`);

            element.style.backgroundColor = `red`;
            expect(element.style.backgroundColor).to.equal(`#ff0000`);

            element.style.backgroundColor = `#FF0000`;
            expect(element.style.backgroundColor).to.equal(`#ff0000`);

            element.style.backgroundColor = null;
            expect(element.style.backgroundColor).to.equal(null);

            element.style.backgroundCharacter = `x`;
            expect(element.style.backgroundCharacter).to.equal(`x`);

        });

        it(`should not accept invalid property values`, () => {

            let element = new Element();

            expect(() => { element.style.display = `lolno` }).to.throw(Error);
            expect(element.style.display).to.equal(`block`);

            expect(() => { element.style.color = 42 }).to.throw(Error);
            expect(element.style.color).to.equal(null);

            expect(() => { element.style.backgroundCharacter = `Super` }).to.throw(Error);
            expect(element.style.backgroundCharacter).to.equal(` `);

            expect(() => { element.style.backgroundCharacter = `` }).to.throw(Error);
            expect(element.style.backgroundCharacter).to.equal(` `);

        });

        it(`should correctly parse style properties and make them accessible via $`, () => {

            let element = new Element();

            element.style.display = null;
            expect(element.style.$.display).to.equal(null);

            element.style.display = `block`;
            expect(element.style.$.display).to.equal(StyleDisplay.block);

            element.style.position = `fixed`;
            expect(element.style.$.position).to.equal(StylePosition.fixed);

        });

    });

});
