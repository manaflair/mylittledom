import { TermElement } from '@manaflair/mylittledom/term';

let ball = new TermElement();
ball.style.position = `absolute`;
ball.style.left = 0;
ball.style.top = 0;
ball.style.width = 10;
ball.style.height = 5;
ball.style.border = `modern`;
ball.style.backgroundCharacter = `#`;
ball.appendTo(screen);

let dx = +1;
let dy = +1;

let animate = () => {

    setTimeout(animate, 1000 / 60);

    if (ball.style.left + dx >= screen.elementRect.width - ball.elementRect.width) {
        ball.style.left = screen.elementRect.width - ball.elementRect.width;
        dx = -1;
    } else if (ball.style.left + dx < 0) {
        ball.style.left = 0;
        dx = +1;
    } else {
        ball.style.left += dx;
    }

    if (ball.style.top + dy >= screen.elementRect.height - ball.elementRect.height) {
        ball.style.top = screen.elementRect.height - ball.elementRect.height;
        dy = -1;
    } else if (ball.style.top + dy < 0) {
        ball.style.top = 0;
        dy = +1;
    } else {
        ball.style.top += dy;
    }

};

animate();
