import { expect }  from 'chai';

import { Element } from '../dom/Element';
import { Screen }  from '../elements/Screen';

describe(`BlockLayout`, () => {

    it(`should correctly position an element inside another`, () => {

        let screen = new Screen();
        screen.style.width = 800;
        screen.style.height = 600;

        let element = new Element();
        screen.appendChild(element);

        screen.triggerUpdates();

        expect(screen.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 600 });
        expect(element.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 0 });

    });

    it(`should correctly position in-flow siblings, one beneath the others`, () => {

        let screen = new Screen();
        screen.style.width = 800;
        screen.style.height = 600;

        let elementA = new Element();
        elementA.style.height = 100;
        screen.appendChild(elementA);

        let elementB = new Element();
        elementB.style.height = 200;
        screen.appendChild(elementB);

        let elementC = new Element();
        elementC.style.height = 300;
        screen.appendChild(elementC);

        screen.triggerUpdates();

        expect(screen.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 600 });
        expect(elementA.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 100 });
        expect(elementB.elementRect).to.deep.equal({ x: 0, y: 100, width: 800, height: 200 });
        expect(elementC.elementRect).to.deep.equal({ x: 0, y: 300, width: 800, height: 300 });

    });

    it(`should correctly compute margin-left: auto`, () => {

        let screen = new Screen();
        screen.style.width = 800;
        screen.style.height = 600;

        let element = new Element();
        element.style.width = 100;
        element.style.height = 100;
        element.style.marginLeft = `auto`;
        screen.appendChild(element);

        screen.triggerUpdates();

        expect(screen.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 600 });
        expect(element.elementRect).to.deep.equal({ x: 700, y: 0, width: 100, height: 100 });

    });

    it(`should correctly compute margin-left: auto`, () => {

        let screen = new Screen();
        screen.style.width = 800;
        screen.style.height = 600;

        let element = new Element();
        element.style.width = 100;
        element.style.height = 100;
        element.style.marginRight = `auto`;
        screen.appendChild(element);

        screen.triggerUpdates();

        expect(screen.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 600 });
        expect(element.elementRect).to.deep.equal({ x: 0, y: 0, width: 100, height: 100 });

    });

    it(`should correctly compute margin-left: auto & margin-right: auto`, () => {

        let screen = new Screen();
        screen.style.width = 800;
        screen.style.height = 600;

        let element = new Element();
        element.style.width = 100;
        element.style.height = 100;
        element.style.marginLeft = `auto`;
        element.style.marginRight = `auto`;
        screen.appendChild(element);

        screen.triggerUpdates();

        expect(screen.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 600 });
        expect(element.elementRect).to.deep.equal({ x: 350, y: 0, width: 100, height: 100 });

    });

    it(`should include own borders and padding when computing and element's rects`, () => {

        let screen = new Screen();
        screen.style.width = 800;
        screen.style.height = 600;

        let element = new Element();
        element.style.borderCharacter = `simple`;
        element.style.padding = 10;
        screen.appendChild(element);

        screen.triggerUpdates();

        expect(screen.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 600 });
        expect(element.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 22 });
        expect(element.contentRect).to.deep.equal({ x: 11, y: 11, width: 778, height: 0 });

    });

    it(`should include parent borders and padding when computing an element's rects`, () => {

        let screen = new Screen();
        screen.style.width = 800;
        screen.style.height = 600;

        let element = new Element();
        element.style.borderCharacter = `simple`;
        element.style.padding = 10;
        screen.appendChild(element);

        let inner = new Element();
        element.appendChild(inner);

        screen.triggerUpdates();

        expect(element.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 22 });
        expect(element.contentRect).to.deep.equal({ x: 11, y: 11, width: 778, height: 0 });

        expect(inner.elementRect).to.deep.equal({ x: 11, y: 11, width: 778, height: 0 });
        expect(inner.contentRect).to.deep.equal({ x: 0, y: 0, width: 778, height: 0 });

    });

    it(`should update its size when its children change their own sizes`, () => {

        let screen = new Screen();
        screen.style.width = 800;
        screen.style.height = 600;

        let element = new Element();
        screen.appendChild(element);

        let inner = new Element();
        inner.style.height = 10;
        element.appendChild(inner);

        screen.triggerUpdates();

        inner.style.height = 20;

        screen.triggerUpdates();

        expect(inner.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 20 });
        expect(element.elementRect).to.deep.equal({ x: 0, y: 0, width: 800, height: 20 });

    });

});
