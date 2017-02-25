import { render }   from '@manaflair/mylittledom/term/react';
import { autobind } from 'core-decorators';
import { random }   from 'faker';

class Window extends React.PureComponent {

    static propTypes = {

        name: React.PropTypes.string,

        x: React.PropTypes.number.isRequired,
        y: React.PropTypes.number.isRequired,

        width: React.PropTypes.number.isRequired,
        height: React.PropTypes.number.isRequired,

        onDrag: React.PropTypes.func,
        onDelete: React.PropTypes.func

    };

    static defaultProps = {

        name: `unnamed`,

        onDrag: () => {},
        onDelete: () => {}

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

        let newPosX = this.props.x + (e.worldCoordinates.x - this.refs.main.elementWorldRect.x) - this.dragDiffX;
        let newPosY = this.props.y + (e.worldCoordinates.y - this.refs.main.elementWorldRect.y) - this.dragDiffY;

        this.props.onDrag(newPosX, newPosY);

    }

    @autobind handleDeleteClick() {

        this.props.onDelete();

    }

    render() {

        return <div ref={`main`} style={{ border: `strong`, position: `absolute`, left: this.props.x, top: this.props.y, width: this.props.width, height: this.props.height }} onMouseDown={e => this.handleMouseDown(e)}>
            <text style={{ position: `absolute`, top: 0, right: 1 }} textContent={`X`} onClick={this.handleDeleteClick} />
            {`Box name: ${this.props.name}`}
            {`Box position: ${this.props.x}x${this.props.y}`}
        </div>;

    }

}

class Example extends React.PureComponent {

    state = {

        windows: []

    };

    @autobind handleClick() {

        let width = 30;
        let height = 4;

        let x = random.number(this.refs.container.elementRect.width - width);
        let y = random.number(this.refs.container.elementRect.height - height);

        this.setState(({ windows }) => {

            let index = windows.length;

            windows = windows.concat([ { x, y, width, height, onDrag: (x, y) => {
                this.handleDrag(index, x, y);
            }, onDelete: () => {
                this.handleDelete(index);
            } } ]);

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

    @autobind handleDelete(index) {

        this.setState(({ windows }) => {

            windows = windows.slice();
            windows[index] = null;

            return { windows };

        });

    }

    render() {

        return <div style={{ padding: [ 1, 2 ], width: `100%`, height: `100%` }}>

            <button textContent={`Add a new window`} style={{ border: `modern`, padding: [ 0, 1 ] }} onClick={e => this.handleClick(e)} />

            <div ref={`container`} style={{ border: `modern`, flex: `auto`, width: `100%`, overflow: `hidden` }}>
                {this.state.windows.map((window, index) => window ? <Window key={index} name={`box#${index}`} {... window} /> : null)}
            </div>

        </div>;

    }

}

render(<Example />, screen);
