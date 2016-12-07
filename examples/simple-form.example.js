import { TermElement, TermText, TermInput } from 'ohui/term';

for (let t = 0; t < 10; ++t) {

    let container = new TermElement();
    container.appendTo(screen);

    let label = new TermText({ textContent: `Hello World!` });
    label.appendTo(container);

    let input = new TermInput({ value: `test`, allowNewlines: true });
    input.appendTo(container);

}
