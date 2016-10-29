import { TermScreen, TermElement } from '../sources/term';

let stdout = Object.create(process.stdout);
//stdout.write = d => console.log(JSON.stringify(d));

let screen = new TermScreen({ debugPaintRects: true });
screen.attachScreen({ stdout });
screen.style.borderCharacter = `strong`;

let container = new TermElement();
screen.appendChild(container);
container.style.position = `relative`;
container.style.width = `100%`;
container.style.height = `100%`;
container.style.backgroundCharacter = `.`;

let ball = new TermElement();
container.appendChild(ball);
ball.style.position = `absolute`;
ball.style.left = 0;
ball.style.top = 0;
ball.style.width = 8;
ball.style.height = 4;
ball.style.borderCharacter = `modern`;

(function run(dx, dy) {

    let left = ball.style.left + dx;
    let top = ball.style.top + dy;

    Object.assign(ball.style, { left, top });

    let screenWidth = container.scrollWidth;
    let screenHeight = container.scrollHeight;

    let ballWidth = ball.offsetWidth;
    let ballHeight = ball.offsetHeight;

    if (left <= 0)
        dx = +1;
    else if (left + ballWidth >= screenWidth)
        dx = -1;

    if (top <= 0)
        dy = +1;
    else if (top + ballHeight >= screenHeight)
        dy = -1;

    setTimeout(() => run(dx, dy), 1000 / 60);

}(+1, +1))

process.stdin.on(`data`, () => {
    process.exit();
});
