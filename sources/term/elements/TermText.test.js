import { expect }      from 'chai';

import { TermElement } from './TermElement';
import { TermText }    from './TermText';

describe(`TermText`, () => {

    it(`should have the height of its content text`, () => {

        let root = new TermElement();
        root.style.width = 100;
        root.style.height = 100;

        let text = new TermText();
        root.appendChild(text);
        text.textContent = `First line\nSecond line\nThird line\nFourth line\nFifth line`;

        root.triggerUpdates();

        expect(text.contentRect).to.deep.equal({ x: 0, y: 0, width: 100, height: 5 });

    });

    it(`should span large lines over multiple lines if necessary`, () => {

        let root = new TermElement();
        root.style.width = 10;
        root.style.height = 100;

        let text = new TermText();
        root.appendChild(text);
        text.textContent = `abcdefghijklmnopqrstuvwxyz\nabcdefghijklmnopqrstuvwxyz\nabcdefghijklmnopqrstuvwxyz`;

        root.triggerUpdates();

        expect(text.contentRect).to.deep.equal({ x: 0, y: 0, width: 10, height: 9 });

    });

    it(`should correctly render its lines`, () => {

        let root = new TermElement();
        root.style.width = 10;
        root.style.height = 100;

        let text = new TermText();
        root.appendChild(text);
        text.style.backgroundCharacter = `.`;
        text.textContent = `abcdefghijklmnopqrstuvwxyz\nabcdefghijklmnopqrstuvwxyz\nabcdefghijklmnopqrstuvwxyz`;

        root.triggerUpdates();

        expect(text.renderContent(0, 0, 10)).to.equal(`abcdefghij`);
        expect(text.renderContent(0, 1, 10)).to.equal(`klmnopqrst`);
        expect(text.renderContent(0, 2, 10)).to.equal(`uvwxyz....`);

        expect(text.renderContent(0, 3, 10)).to.equal(`abcdefghij`);
        expect(text.renderContent(0, 4, 10)).to.equal(`klmnopqrst`);
        expect(text.renderContent(0, 5, 10)).to.equal(`uvwxyz....`);

        expect(text.renderContent(0, 6, 10)).to.equal(`abcdefghij`);
        expect(text.renderContent(0, 7, 10)).to.equal(`klmnopqrst`);
        expect(text.renderContent(0, 8, 10)).to.equal(`uvwxyz....`);

    });

    it(`should render its line by taking borders and padding into account`, () => {

        let root = new TermElement();
        root.style.width = 12;
        root.style.height = 100;

        let text = new TermText();
        root.appendChild(text);
        text.style.padding = 1;
        text.style.backgroundCharacter = `.`;
        text.textContent = `abcdefghijklmnopqrstuvwxyz`;

        root.triggerUpdates();

        expect(text.renderElement(0, 0, 12)).to.equal(`............`);

        expect(text.renderElement(0, 1, 12)).to.equal(`.abcdefghij.`);
        expect(text.renderElement(0, 2, 12)).to.equal(`.klmnopqrst.`);
        expect(text.renderElement(0, 3, 12)).to.equal(`.uvwxyz.....`);

        expect(text.renderElement(0, 4, 12)).to.equal(`............`);

    });

});
