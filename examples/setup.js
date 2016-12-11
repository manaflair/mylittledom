import { TermScreen } from 'ohui/term';

global.screen = new TermScreen({ debugPaintRects: true });
screen.attachScreen();
