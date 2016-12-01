import { TermScreen, TermElement, TermText, TermInput } from '../sources/term';

let stdout = Object.create(process.stdout);
//stdout.write = d => 0 && console.log(JSON.stringify(d));

let screen = new TermScreen({ debugPaintRects: true });
screen.attachScreen({ stdout });

for (let t = 0; t < 10; ++t) {

    let container = new TermElement();
    container.appendTo(screen);

    let label = new TermText({ textContent: `Hello World!` });
    label.appendTo(container);

    let input = new TermInput({ value: `test`, allowNewlines: true });
    input.appendTo(container);

}
