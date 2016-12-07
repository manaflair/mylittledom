import { expect }            from 'chai';
import TextBuffer, { Point } from 'text-buffer';

import { TextFormatter }     from './TextFormatter';

describe(`TextFormatter`, () => {

    describe(`Stress tests`, () => {

        it(`stress test #1`, () => {

            let textBuffer = new TextBuffer();
            let textFormatter = TextFormatter.open(textBuffer);

            for (let t = 0; t < 30; ++t)
                textBuffer.append(`Foo\n`);

            expect(textFormatter.lineInfo).to.have.length(31);
            expect(textFormatter.getText()).to.equal(`Foo\n`.repeat(30));

        });

        it(`stress test #2`, () => {

            let textBuffer = new TextBuffer();
            let textFormatter = TextFormatter.open(textBuffer);

            for (let t = 0; t < 30; ++t) {
                textBuffer.append(`a`);
                textBuffer.append(` `);
            }

            expect(textFormatter.lineInfo).to.have.length(1);
            expect(textFormatter.getText()).to.equal(`a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a`);

        });

        it(`stress test #3`, () => {

            let textBuffer = new TextBuffer();
            let textFormatter = TextFormatter.open(textBuffer, { columns: 10, collapseWhitespaces: true, justifyText: true });

            for (let t = 0; t < 30; ++t) {
                textBuffer.append(`a`);
                textBuffer.append(` `);
            }

            expect(textFormatter.lineInfo).to.have.length(6);
            expect(textFormatter.getText()).to.equal(`a  a a a a\na  a a a a\na  a a a a\na  a a a a\na  a a a a\na a a a a`);

        });

        it(`stress test #4`, () => {

            let textBuffer = new TextBuffer();
            let textFormatter = TextFormatter.open(textBuffer, { columns: 10, collapseWhitespaces: true, justifyText: true });

            let caretOffset = 0;

            for (let c of `a b c d e f g h i j k l m n o p q r s t u v w x y z\nA B C D E F G H I J K L M N O P Q R S T U V W X Y Z`) {
                textBuffer.insert(textBuffer.positionForCharacterIndex(caretOffset), c);
                caretOffset += 1;
            }

            //expect(textFormatter.lineInfo).to.have.length(12);
            expect(textFormatter.getText()).to.equal(`a  b c d e\nf  g h i j\nk  l m n o\np  q r s t\nu  v w x y\nz\nA  B C D E\nF  G H I J\nK  L M N O\nP  Q R S T\nU  V W X Y\nZ`);

        });

    });

    describe(`Formatting`, () => {

        it(`should correctly parse a single line`, () => {

            let textBuffer = new TextBuffer(`Hello World`);
            let textFormatter = TextFormatter.open(textBuffer);

            expect(textFormatter.lineInfo).to.have.length(1);
            expect(textFormatter.getText()).to.equal(`Hello World`);

        });

        it(`should correctly parse multiple lines`, () => {

            let textBuffer = new TextBuffer(`Hello\nWorld`);
            let textFormatter = TextFormatter.open(textBuffer);

            expect(textFormatter.lineInfo).to.have.length(2);
            expect(textFormatter.getText()).to.equal(`Hello\nWorld`);

        });

        it(`should support ending a text with a newline character`, () => {

            let textBuffer = new TextBuffer(`Hello World\n`);
            let textFormatter = TextFormatter.open(textBuffer);

            expect(textFormatter.lineInfo).to.have.length(2);
            expect(textFormatter.getText()).to.equal(`Hello World\n`);

        });

        it(`should correctly normalize characters`, () => {

            let textBuffer = new TextBuffer(`Hello\tWorld!\r\nThis is a\rtest.`);
            let textFormatter = TextFormatter.open(textBuffer);

            expect(textFormatter.getText()).to.equal(`Hello    World!\nThis is a\ntest.`);

        });

        it(`should correctly wrap text`, () => {

            let textBuffer = new TextBuffer(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`);
            let textFormatter = TextFormatter.open(textBuffer, { columns: 4 });

            expect(textFormatter.getText()).to.equal(`ABCD\nEFGH\nIJKL\nMNOP\nQRST\nUVWX\nYZ`);

        });

        it(`should avoid breaking words unless requested`, () => {

            let textBuffer = new TextBuffer(`Horse Tiger Snake Zebra Mouse Sheep Whale Panda`);
            let textFormatter = TextFormatter.open(textBuffer, { columns: 8 });

            expect(textFormatter.getText()).to.equal(`Horse\nTiger\nSnake\nZebra\nMouse\nSheep\nWhale\nPanda`);

            let textFormatter2 = TextFormatter.open(textBuffer, { columns: 8, allowWordBreaks: true });

            expect(textFormatter2.getText()).to.equal(`Horse Ti\nger Snak\ne Zebra\nMouse Sh\neep Whal\ne Panda`);

        });

        it(`should collapse whitespaces if requested`, () => {

            let textBuffer = new TextBuffer(`Hello      world     \t  test!`);
            let textFormatter = TextFormatter.open(textBuffer, { collapseWhitespaces: true });

            expect(textFormatter.getText()).to.equal(`Hello world test!`);

        });

        it(`should justify the text if requested`, () => {

            let textBuffer = new TextBuffer(`Horse Tiger Snake Zebra Mouse Sheep Whale Panda`);
            let textFormatter = TextFormatter.open(textBuffer, { columns: 14, justifyText: true, collapseWhitespaces: true });

            expect(textFormatter.getText()).to.equal(`Horse    Tiger\nSnake    Zebra\nMouse    Sheep\nWhale Panda`);

        });

        it(`should support updating a single line`, () => {

            let textBuffer = new TextBuffer(`Hello World\nThis is a test`);
            let textFormatter = TextFormatter.open(textBuffer);

            textBuffer.setTextInRange([ [ 0, 6 ], [ 0, 11 ] ], `Toto`);

            expect(textFormatter.getText()).to.equal(`Hello Toto\nThis is a test`);

        });

        it(`should support updating multiple lines`, () => {

            let textBuffer = new TextBuffer(`Horse\nTiger\nSnake\nZebra\nMouse\nSheep\nWhale\nPanda`);
            let textFormatter = TextFormatter.open(textBuffer);

            textBuffer.setTextInRange([ [ 1, 1 ], [ 2, 4 ] ], `atou\nSwin`);

            expect(textFormatter.getText()).to.equal(`Horse\nTatou\nSwine\nZebra\nMouse\nSheep\nWhale\nPanda`);

        });

        it(`should support adding new lines when updating`, () => {

            let textBuffer = new TextBuffer(`Horse\nTiger\nSnake\nZebra\nMouse\nSheep\nWhale\nPanda`);
            let textFormatter = TextFormatter.open(textBuffer);

            textBuffer.setTextInRange([ [ 1, 1 ], [ 2, 4 ] ], `iger\nTatoo\nSwine\nSnak`);

            expect(textFormatter.getText()).to.equal(`Horse\nTiger\nTatoo\nSwine\nSnake\nZebra\nMouse\nSheep\nWhale\nPanda`);

        });

        it(`should support removing new lines when updating`, () => {

            let textBuffer = new TextBuffer(`Horse\nTiger\nSnake\nZebra\nMouse\nSheep\nWhale\nPanda`);
            let textFormatter = TextFormatter.open(textBuffer);

            textBuffer.setTextInRange([ [ 2, 1 ], [ 5, 1 ] ], ``);

            expect(textFormatter.getText()).to.equal(`Horse\nTiger\nSheep\nWhale\nPanda`);

        });

        it(`should support removing the last newline character`, () => {

            let textBuffer = new TextBuffer(`Hello World\n`);
            let textFormatter = TextFormatter.open(textBuffer);

            textBuffer.setTextInRange([ [ 0, 11 ], [ 1, 0 ] ], ``);

            expect(textFormatter.getText()).to.equal(`Hello World`);

        });

        it(`should support removing a newline character amongst many`, () => {

            let textBuffer = new TextBuffer(`Hello World\n\n\n`);
            let textFormatter = TextFormatter.open(textBuffer);

            textBuffer.setTextInRange([ [ 1, 0 ], [ 2, 0 ] ], ``);

            expect(textFormatter.getText()).to.equal(`Hello World\n\n`);

        });

        it(`should not delete the last newline when removing the last character that immediatly follows it`, () => {

            let textBuffer = new TextBuffer(`Hello World\nX`);
            let textFormatter = TextFormatter.open(textBuffer);

            textBuffer.setTextInRange([ [ 1, 0 ], [ 1, 1 ] ], ``);

            expect(textFormatter.getText()).to.equal(`Hello World\n`);

        });

    });

    describe(`Methods`, () => {

        describe(`#positionForCharacterIndex()`, () => {

            it(`should correctly return the formatter position for a given character index`, () => {

                let textBuffer = new TextBuffer(`Hello World\nFoo Bar!`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.positionForCharacterIndex(4)).to.deep.equal(new Point(0, 4));
                expect(textFormatter.positionForCharacterIndex(15)).to.deep.equal(new Point(1, 3));

            });

            it(`should work even when the first characters are skipped`, () => {

                let textBuffer = new TextBuffer(`    Hello World!`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.positionForCharacterIndex(0)).to.deep.equal(new Point(0, 0));

            });

            it(`should work even for the last character`, () => {

                let textBuffer = new TextBuffer(`Hello World`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.positionForCharacterIndex(11)).to.deep.equal(new Point(0, 11));

            });

        });

        describe(`#moveLeft()`, () => {

            it(`should be able to move a cursor inside static tokens`, () => {

                let textBuffer = new TextBuffer(`Hello`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveLeft([ 0, 3 ])).to.deep.equal(Point.fromObject([ 0, 2 ]));

            });

            it(`should skip over dynamic tokens entirely`, () => {

                let textBuffer = new TextBuffer(`Hello\tWorld`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveLeft([ 0, 9 ])).to.deep.equal(Point.fromObject([ 0, 5 ]));

            });

            it(`should go to the previous line when already on the left edge of a line`, () => {

                let textBuffer = new TextBuffer(`Hello World\nThis is a test`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveLeft([ 1, 0 ])).to.deep.equal(Point.fromObject([ 0, 11 ]));

            });

            it(`shouldn't do anything when already on the very top-left of the document`, () => {

                let textBuffer = new TextBuffer(`Hello World\nThis is a test`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveLeft([ 0, 0 ])).to.deep.equal(Point.fromObject([ 0, 0 ]));

            });

        });

        describe(`#moveRight()`, () => {

            it(`should be able to move a cursor inside static tokens`, () => {

                let textBuffer = new TextBuffer(`Hello`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveRight([ 0, 3 ])).to.deep.equal(Point.fromObject([ 0, 4 ]));

            });

            it(`should skip over dynamic tokens entirely`, () => {

                let textBuffer = new TextBuffer(`Hello\tWorld`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveRight([ 0, 5 ])).to.deep.equal(Point.fromObject([ 0, 9 ]));

            });

            it(`should go to the next line when already on the right edge of a line`, () => {

                let textBuffer = new TextBuffer(`Hello World\nThis is a test`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveRight([ 0, 11 ])).to.deep.equal(Point.fromObject([ 1, 0 ]));

            });

            it(`shouldn't do anything when already on the very bottom-right of the document`, () => {

                let textBuffer = new TextBuffer(`Hello World\nThis is a test`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveRight([ 1, 14 ])).to.deep.equal(Point.fromObject([ 1, 14 ]));

            });

        });

        describe(`#moveUp()`, () => {

            it(`should be able to move a cursor inside static tokens`, () => {

                let textBuffer = new TextBuffer(`Hello\nWorld`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveUp([ 1, 2 ])).to.deep.equal(Point.fromObject([ 0, 2 ]));

            });

            it(`should prevent jumping inside a dynamic token`, () => {

                let textBuffer = new TextBuffer(`Hello\tWorld\nThis is a test`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveUp([ 1, 6 ])).to.deep.equal(Point.fromObject([ 0, 5 ]));
                expect(textFormatter.moveUp([ 1, 7 ])).to.deep.equal(Point.fromObject([ 0, 9 ]));

            });

            it(`should move to the beginning of the line when already on the very first line`, () => {

                let textBuffer = new TextBuffer(`Hello World`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveUp([ 0, 5 ])).to.deep.equal(Point.fromObject([ 0, 0 ]));

            });

        });

        describe(`#moveDown()`, () => {

            it(`should be able to move a cursor inside static tokens`, () => {

                let textBuffer = new TextBuffer(`Hello\nWorld`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveDown([ 0, 2 ])).to.deep.equal(Point.fromObject([ 1, 2 ]));

            });

            it(`should prevent jumping inside a dynamic token`, () => {

                let textBuffer = new TextBuffer(`This is a test\nHello\tWorld`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveDown([ 0, 6 ])).to.deep.equal(Point.fromObject([ 1, 5 ]));
                expect(textFormatter.moveDown([ 0, 7 ])).to.deep.equal(Point.fromObject([ 1, 9 ]));

            });

            it(`should move to the line ending when already on the very last line`, () => {

                let textBuffer = new TextBuffer(`Hello World`);
                let textFormatter = TextFormatter.open(textBuffer);

                expect(textFormatter.moveDown([ 0, 5 ])).to.deep.equal(Point.fromObject([ 0, 11 ]));

            });

        });

    });

});
