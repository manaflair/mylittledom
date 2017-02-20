import { render }      from '@manaflair/mylittledom/term/react';
import { makeRuleset } from '@manaflair/mylittledom';
import { autobind }    from 'core-decorators';

let rowStyle = makeRuleset({

    flexDirection: `row`,

    marginTop: 1

}, `:firstChild`, {

    marginTop: 0

});

let entryStyle = makeRuleset({

    marginLeft: 2

}, `:firstChild`, {

    marginLeft: 0

});

class Input extends React.PureComponent {

    static propTypes = {

        label: React.PropTypes.string.isRequired,
        element: React.PropTypes.node.isRequired,

        classList: React.PropTypes.array,
        style: React.PropTypes.object

    };

    static defaultProps = {

        classList: [],
        style: {}

    };

    render() {

        return <label classList={this.props.classList} style={this.props.style}>
            <text textContent={this.props.label} style={{ marginBottom: 1, fontWeight: `bold` }} />
            {this.props.element}
        </label>;

    }

}

class Example extends React.PureComponent {

    render() {

        return <form style={{ padding: [ 1, 2 ] }}>

            <div style={{ border: `rounded`, padding: [ 1, 2 ] }}>

                <div classList={[ rowStyle ]}>
                    <Input classList={[ entryStyle ]} label={`Movie title`} element={<input />} style={{ flex: 5 }} />
                    <Input classList={[ entryStyle ]} label={`Genre`} element={<input />} style={{ flex: 2 }} />
                </div>

                <div classList={[ rowStyle ]}>
                    <Input classList={[ entryStyle ]} label={`Director`} element={<input />} style={{ flex: 1 }} />
                    <Input classList={[ entryStyle ]} label={`Writer`} element={<input />} style={{ flex: 1 }} />
                    <Input classList={[ entryStyle ]} label={`Producer`} element={<input />} style={{ flex: 1 }} />
                </div>

                <div classList={[ rowStyle ]}>
                    <Input classList={[ entryStyle ]} label={`Website`} element={<input />} style={{ flex: 1 }} />
                    <Input classList={[ entryStyle ]} label={`Youtube trailer`} element={<input />} style={{ flex: 1 }} />
                </div>

                <div classList={[ rowStyle ]}>
                    <Input classList={[ entryStyle ]} label={`Review`} element={<input multiline={true} />} style={{ flex: 1 }} />
                </div>

                <div classList={[ rowStyle ]}>
                    <Input label={`Rating`} element={<div classList={[ rowStyle ]} style={{ flexDirection: `row` }}>
                        <label style={{ flexDirection: `row` }}><radio name={`rating`} value={0} /><text textContent={`Terrible`} style={{ marginLeft: 1 }} /></label>
                        <label style={{ flexDirection: `row`, marginLeft: 1 }}><radio name={`rating`} value={5} /><text textContent={`Watchable`} style={{ marginLeft: 1 }} /></label>
                        <label style={{ flexDirection: `row`, marginLeft: 1 }}><radio name={`rating`} value={10} /><text textContent={`Best ever`} style={{ marginLeft: 1 }} /></label>
                    </div>} />
                </div>

            </div>

            <div style={{ border: `rounded`, padding: [ 1, 2 ], marginTop: 1 }}>

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

        </form>;

    }

}

render(<Example />, screen);
