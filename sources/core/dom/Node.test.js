import { expect } from 'chai';

import { Node }   from './Node';

describe(`Node`, () => {

    it(`should start empty`, () => {

        let root = new Node();

        expect(root.rootNode).to.equal(root);
        expect(root.parentNode).to.equal(null);

        expect(root.previousSibling).to.equal(null);
        expect(root.nextSibling).to.equal(null);

        expect(root.childNodes).to.have.length(0);

        expect(root.firstChild).to.equal(null);
        expect(root.lastChild).to.equal(null);

    });

    describe(`#appendChild`, () => {

        it(`should correctly append a single node`, () => {

            let root = new Node();

            let node = new Node();
            root.appendChild(node);

            expect(root.childNodes).to.have.length(1);
            expect(root.childNodes[0]).to.equal(node);

            expect(root.firstChild).to.equal(node);
            expect(root.lastChild).to.equal(node);

            expect(node.rootNode).to.equal(root);
            expect(node.parentNode).to.equal(root);

            expect(node.previousSibling).to.equal(null);
            expect(node.nextSibling).to.equal(null);

        });

        it(`should correctly append multiple children`, () => {

            let root = new Node();

            let nodeA = new Node();
            root.appendChild(nodeA);

            let nodeB = new Node();
            root.appendChild(nodeB);

            expect(root.childNodes).to.have.length(2);
            expect(root.childNodes[0]).to.equal(nodeA);
            expect(root.childNodes[1]).to.equal(nodeB);

            expect(root.firstChild).to.equal(nodeA);
            expect(root.lastChild).to.equal(nodeB);

            expect(nodeA.rootNode).to.equal(root);
            expect(nodeA.parentNode).to.equal(root);

            expect(nodeA.previousSibling).to.equal(null);
            expect(nodeA.nextSibling).to.equal(nodeB);

            expect(nodeB.rootNode).to.equal(root);
            expect(nodeB.parentNode).to.equal(root);

            expect(nodeB.previousSibling).to.equal(nodeA);
            expect(nodeB.nextSibling).to.equal(null);

        });

    });

    describe(`#removeChild()`, () => {

        it(`should correctly remove a single node`, () => {

            let root = new Node();

            let node = new Node();
            root.appendChild(node);

            root.removeChild(node);

            expect(root.childNodes).to.have.length(0);

            expect(root.firstChild).to.equal(null);
            expect(root.lastChild).to.equal(null);

            expect(node.rootNode).to.equal(node);
            expect(node.parentNode).to.equal(null);

        });

        it(`should correctly remove a single node amongst many`, () => {

            let root = new Node();

            let nodeA = new Node();
            root.appendChild(nodeA);

            let nodeB = new Node();
            root.appendChild(nodeB);

            let nodeC = new Node();
            root.appendChild(nodeC);

            root.removeChild(nodeB);

            expect(root.childNodes).to.have.length(2);

            expect(root.firstChild).to.equal(nodeA);
            expect(root.lastChild).to.equal(nodeC);

            expect(nodeA.previousSibling).to.equal(null);
            expect(nodeA.nextSibling).to.equal(nodeC);

            expect(nodeC.previousSibling).to.equal(nodeA);
            expect(nodeC.nextSibling).to.equal(null);

        });

    });

});
