import { render }   from '@manaflair/mylittledom/term/react';
import { autobind } from 'core-decorators';

class Input extends React.PureComponent {

    static propTypes = {

        label: React.PropTypes.string.isRequired,
        element: React.PropTypes.node.isRequired,

        style: React.PropTypes.object

    };

    static defaultProps = {

        style: {}

    };

    render() {

        return <label style={this.props.style}>
            <text textContent={this.props.label} style={{ marginBottom: 1, fontWeight: `bold` }} />
            {this.props.element}
        </label>;

    }

}

class Example extends React.PureComponent {

    render() {

        return <div style={{ padding: 2 }}>

            <div style={{ border: `strong`, padding: [ 1, 2 ] }}>

                <div style={{ flexDirection: `row` }}>
                    <Input label={`Movie title`} element={<input />} style={{ flex: 5 }} />
                    <Input label={`Genre`} element={<input />} style={{ flex: 2, marginLeft: 2 }} />
                </div>

                <div style={{ flexDirection: `row`, marginTop: 1 }}>
                    <Input label={`Director`} element={<input />} style={{ flex: 1 }} />
                    <Input label={`Writer`} element={<input />} style={{ flex: 1, marginLeft: 2 }} />
                    <Input label={`Producer`} element={<input />} style={{ flex: 1, marginLeft: 2 }} />
                </div>

                <div style={{ flexDirection: `row`, marginTop: 1 }}>
                    <Input label={`Website`} element={<input />} style={{ flex: 1 }} />
                    <Input label={`Youtube trailer`} element={<input />} style={{ flex: 1, marginLeft: 2 }} />
                </div>

                <div style={{ flexDirection: `row`, marginTop: 1 }}>
                    <Input label={`Review`} element={<input multiline={true} />} style={{ flex: 1 }} />
                </div>

                <div style={{ flexDirection: `row`, marginTop: 1 }}>
                    <Input label={`Rating`} element={<div style={{ flexDirection: `row` }}>
                        <label style={{ flexDirection: `row` }}><radio name={`rating`} value={0} /><text textContent={`Terrible`} style={{ marginLeft: 1 }} /></label>
                        <label style={{ flexDirection: `row`, marginLeft: 1 }}><radio name={`rating`} value={5} /><text textContent={`Watchable`} style={{ marginLeft: 1 }} /></label>
                        <label style={{ flexDirection: `row`, marginLeft: 1 }}><radio name={`rating`} value={10} /><text textContent={`Best ever`} style={{ marginLeft: 1 }} /></label>
                    </div>} />
                </div>

            </div>

            <div style={{ border: `modern`, padding: [ 1, 2 ], marginTop: 1 }}>

                <div style={{ flexDirection: `row` }}>
                    <Input label={`Collection`} element={<div style={{ flexDirection: `row` }}>
                        <label style={{ flexDirection: `row` }}><checkbox name={`collection`} value={true} /><text textContent={`Already in your collection`} style={{ marginLeft: 1 }} /></label>
                    </div>} />
                </div>

                <div style={{ flexDirection: `row`, marginTop: 1 }}>
                    <Input label={`Watch list`} element={<div style={{ flexDirection: `row` }}>
                        <label style={{ flexDirection: `row` }}><checkbox name={`watched`} value={true} /><text textContent={`Already in your collection`} style={{ marginLeft: 1 }} /></label>
                        <label style={{ flexDirection: `row`, marginLeft: 1 }}><checkbox name={`watchlist`} value={true} /><text textContent={`On your watchlist`} style={{ marginLeft: 1 }} /></label>
                    </div>} />
                </div>

            </div>

            <div style={{ flexDirection: `row`, marginTop: 1 }}>
                <button textContent={`Submit`} style={{ border: `modern`, padding: [ 0, 2 ] }} />
            </div>

        </div>;

    }

}

render(<Example />, screen);
