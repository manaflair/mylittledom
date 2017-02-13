import { render }   from '@manaflair/mylittledom/term/react';
import { autobind } from 'core-decorators';
import { random }   from 'faker';

class Window extends React.PureComponent {

    static propTypes = {

        x: React.PropTypes.number.isRequired,
        y: React.PropTypes.number.isRequired,

        width: React.PropTypes.number.isRequired,
        height: React.PropTypes.number.isRequired,

        onDrag: React.PropTypes.func

    };

    static defaultProps = {

        onDrag: () => {}

    };

    isDragged = false;

    dragDiffX = 0;
    dragDiffY = 0;

    componentDidMount() {

        screen.addEventListener(`mouseup`, this.handleMouseUp);
        screen.addEventListener(`mousemove`, this.handleMouseMove);

    }

    componentWillUnmount() {

        screen.removeEventListener(`mouseup`, this.handleMouseUp);
        screen.removeEventListener(`mousemove`, this.handleMouseMove);

    }

    @autobind handleMouseDown(e) {

        this.isDragged = true;

        this.dragDiffX = e.worldCoordinates.x - this.refs.main.elementWorldRect.x;
        this.dragDiffY = e.worldCoordinates.y - this.refs.main.elementWorldRect.y;

    }

    @autobind handleMouseUp() {

        this.isDragged = false;

    }

    @autobind handleMouseMove(e) {

        if (!this.isDragged)
            return;

        let newPosX = e.worldCoordinates.x - this.dragDiffX;
        let newPosY = e.worldCoordinates.y - this.dragDiffY;

        this.props.onDrag(newPosX, newPosY);

    }

    render() {

        return <div ref={`main`} style={{ border: `strong`, position: `absolute`, left: this.props.x, top: this.props.y, width: this.props.width, height: this.props.height }} onMouseDown={e => this.handleMouseDown(e)}>
            {`Box position: ${this.props.x}x${this.props.y}`}
        </div>;

    }

}

class Example extends React.PureComponent {

    state = {

        windows: []

    };

    componentDidMount() {

        setTimeout(() => {

            this.handleClick();
            this.handleClick();
            this.handleClick();

        }, 1500);

    }

    @autobind handleClick() {

        let width = 20;
        let height = 10;

        let x = random.number(this.refs.main.elementRect.width - width);
        let y = random.number(this.refs.main.elementRect.height - height);

        this.setState(({ windows }) => {

            windows = windows.concat([ { x, y, width, height } ]);

            return { windows };

        });

    }

    @autobind handleDrag(index, x, y) {

        this.setState(({ windows }) => {

            windows = windows.slice();
            windows[index] = Object.assign({}, windows[index], { x, y });

            return { windows };

        });

    }

    render() {

        return <div ref={`main`} style={{ padding: [ 1, 2 ], width: `100%`, height: `100%` }}>

            <button textContent={`Add a new window`} style={{ border: `modern`, padding: [ 0, 1 ] }} onClick={e => this.handleClick(e)} />

            {this.state.windows.map((window, index) => <Window key={index} onDrag={(x, y) => this.handleDrag(index, x, y)} {... window} />)}

        </div>;

    }

}

render(<Example />, screen);
