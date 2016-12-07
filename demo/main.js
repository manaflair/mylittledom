import 'resize-observer-polyfill/index.global';
import './main.css';

import ReactDOM        from 'react-dom';
import { Application } from './Application';

let main = document.createElement('div');
main.id = `main`;

ReactDOM.render(<Application />, main);
document.body.appendChild(main);
