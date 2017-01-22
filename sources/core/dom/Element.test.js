import { expect }        from 'chai';

import { StyleDisplay }  from '../style/types/StyleDisplay';
import { StyleLength }   from '../style/types/StyleLength';
import { StylePosition } from '../style/types/StylePosition';

import { Element }       from './Element';

describe(`Element`, () => {

    describe(`#generateRenderList`, () => {

        it(`should correctly resolve a set of mixed elements (small test)`, () => {

            let elementA = new Element({ name: `A` });

            let elementB = new Element({ name: `B` });
            elementA.appendChild(elementB);
            elementB.style.zIndex = 2;

            let elementC = new Element({ name: `C` });
            elementB.appendChild(elementC);

            let elementD = new Element({ name: `D` });
            elementA.appendChild(elementD);
            elementD.style.zIndex = 1;

            let renderList = elementA.generateRenderList();

            expect(renderList).to.have.length(4);

            expect(renderList).to.have.property(0, elementC);
            expect(renderList).to.have.property(1, elementB);
            expect(renderList).to.have.property(2, elementD);
            expect(renderList).to.have.property(3, elementA);

        });

        it(`should correctly resolve a set of mixed elements (complex case)`, () => {

            let elementA = new Element({ name: `A` });

            let elementB = new Element({ name: `B` });
            elementA.appendChild(elementB);

            let elementC = new Element({ name: `C` });
            elementB.appendChild(elementC);
            elementC.style.zIndex = 1;

            let elementD = new Element({ name: `D` });
            elementB.appendChild(elementD);

            let elementE = new Element({ name: `E` });
            elementD.appendChild(elementE);
            elementE.style.zIndex = 3;

            let elementF = new Element({ name: `F` });
            elementB.appendChild(elementF);
            elementF.style.zIndex = 2;

            let elementG = new Element({ name: `G` });
            elementF.appendChild(elementG);

            let elementH = new Element({ name: `H` });
            elementA.appendChild(elementH);
            elementH.style.zIndex = 2;

            let renderList = elementA.generateRenderList();

            expect(renderList).to.have.length(8);

            expect(renderList).to.have.property(0, elementE);
            expect(renderList).to.have.property(1, elementH);
            expect(renderList).to.have.property(2, elementG);
            expect(renderList).to.have.property(3, elementF);
            expect(renderList).to.have.property(4, elementC);
            expect(renderList).to.have.property(5, elementD);
            expect(renderList).to.have.property(6, elementB);
            expect(renderList).to.have.property(7, elementA);

        });

    });

    describe(`#style`, () => {

        it(`should start with default values`, () => {

            let element = new Element();

            expect(element.style.$.display).to.equal(StyleDisplay.flex);

        });

        it(`should accept valid property values`, () => {

            let element = new Element();

            element.style.display = null;
            expect(element.style.display).to.equal(null);

            element.style.display = `flex`;
            expect(element.style.display).to.equal(`flex`);

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
            expect(element.style.$.display).to.equal(StyleDisplay.flex);

            expect(() => { element.style.color = 42 }).to.throw(Error);
            expect(element.style.$.color).to.equal(null);

            expect(() => { element.style.backgroundCharacter = `Super` }).to.throw(Error);
            expect(element.style.$.backgroundCharacter).to.equal(` `);

            expect(() => { element.style.backgroundCharacter = `` }).to.throw(Error);
            expect(element.style.$.backgroundCharacter).to.equal(` `);

        });

        it(`should correctly parse style properties and make them accessible via $`, () => {

            let element = new Element();

            element.style.display = null;
            expect(element.style.$.display).to.equal(null);

            element.style.display = `flex`;
            expect(element.style.$.display).to.equal(StyleDisplay.flex);

            element.style.position = `fixed`;
            expect(element.style.$.position).to.equal(StylePosition.fixed);

        });

        it(`should support shorthand properties`, () => {

            let element = new Element();

            element.style.padding = 1;
            expect(element.style.$.paddingLeft).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(1));
            expect(element.style.$.paddingRight).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(1));
            expect(element.style.$.paddingTop).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(1));
            expect(element.style.$.paddingBottom).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(1));

            element.style.padding = [ 1, 2 ];
            expect(element.style.$.paddingLeft).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(2));
            expect(element.style.$.paddingRight).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(2));
            expect(element.style.$.paddingTop).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(1));
            expect(element.style.$.paddingBottom).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(1));

            element.style.padding = [ 1, 2, 3, 4 ];
            expect(element.style.$.paddingLeft).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(4));
            expect(element.style.$.paddingRight).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(2));
            expect(element.style.$.paddingTop).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(1));
            expect(element.style.$.paddingBottom).to.be.instanceof(StyleLength).and.to.deep.equal(new StyleLength(3));

        });

    });

});
