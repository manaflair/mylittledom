import 'xterm/dist/xterm.css';
import './Terminal.css';

import { autobind }    from 'core-decorators';
import EventEmitter    from 'eventemitter3';
import Measure         from 'react-measure';
import { PassThrough } from 'stream';
import { fit }         from 'xterm/lib/addons/fit/fit';
import XTerm           from 'xterm';

export class Terminal extends React.PureComponent {

    constructor(props) {

        super(props);

        this.term = new XTerm();

        this.stdin = new PassThrough();
        this.stdout = new PassThrough();

        this.stdout.rows = 0;
        this.stdout.columns = 0;

        this.term.on(`resize`, ({ rows, cols: columns }) => {
            Object.assign(this.stdout, { rows, columns }).emit(`resize`);
        });

        this.term.on(`data`, data => {
            this.stdin.write(data.toString());
        });

        this.stdout.on(`data`, data => {
            this.term.write(data.toString());
        });

    }

    componentDidMount() {

        this.term.open(this.refs.main);

    }

    @autobind handleResize(dimensions) {

        if (!this.term.element)
            return;

        fit(this.term);

    }

    clear() {

        this.term.clear();

    }

    render() {

        return <Measure onMeasure={this.handleResize}>

            <div ref={`main`} className={`Terminal`} />

        </Measure>;

    }

}
