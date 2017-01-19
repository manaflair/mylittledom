import { render }   from '@manaflair/mylittledom/term/react';
import { autobind } from 'core-decorators';
import { lorem }    from 'faker';

class LineNumber extends React.Component {

    static propTypes = {

        style: React.PropTypes.object,

        startingRow: React.PropTypes.number

    };

    componentWillReceiveProps(nextProps) {

        if (nextProps.startingRow !== this.props.startingRow) {
            this.refs.main.queueDirtyRect();
        }

    }

    @autobind handleRender(ref, x, y, l) {

        return `${this.props.startingRow + y}`.padEnd(ref.contentRect.width).substr(x, l);

    }

    render() {

        return <div ref={`main`} style={{ ... this.props.style }} onContentRender={this.handleRender} />;

    }

}

class Editor extends React.Component {

    static propTypes = {

        value: React.PropTypes.string

    };

    state = {

        inputScroll: 0

    };

    @autobind handleScroll(e) {

        this.setState({ inputScroll: e.target.scrollTop });

    }

    render() {

        return <div style={{ position: `relative`, paddingLeft: 4 }}>

            <LineNumber style={{

                position: `absolute`,

                left: 0, width: 4,
                top: 0, bottom: 0

            }} startingRow={this.state.inputScroll} />

            <input style={{

                backgroundCharacter: ` `,
                backgroundColor: null,

                minHeight: 1,
                maxHeight: `100%`

            }} multiline={true} onScroll={this.handleScroll} value={this.props.value} />

        </div>;

    }

}

render(<Editor value={lorem.paragraphs(5)} />, screen);
