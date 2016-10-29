import spies                 from 'chai-spies';
import chai, { expect, spy } from 'chai';

import { EventSource }       from './EventSource';
import { Event }             from './Event';

chai.use(spies);

describe(`EventSource`, () => {

    it(`should correctly trigger event listeners that listen on a given event`, () => {

        let source = {};
        EventSource.setup(source);
        source.declareEvent(`test`);

        let fn = spy(() => {});
        source.addEventListener(`test`, fn);

        let event = new Event(`test`);
        source.dispatchEvent(event);

        expect(fn).to.have.been.called.with(event);

    });

    it(`should not trigger event listeners that listen on other events`, () => {

        let source = {};
        EventSource.setup(source);
        source.declareEvent(`testA`);
        source.declareEvent(`testB`);

        let fnA = spy(() => {});
        source.addEventListener(`testA`, fnA);

        let fnB = spy(() => {});
        source.addEventListener(`testB`, fnB);

        let event = new Event(`testA`);
        source.dispatchEvent(event);

        expect(fnA).to.have.been.called.with(event);
        expect(fnB).to.not.have.been.called();

    });

    it(`should trigger the default action after calling all the listeners`, () => {

        let source = {};
        EventSource.setup(source);
        source.declareEvent(`test`);

        let fnA = spy(() => {});
        source.addEventListener(`test`, fnA);

        let event = new Event(`test`);

        let fnB = spy(() => { expect(fnA).to.have.been.called.once; });
        event.setDefault(fnB);

        source.dispatchEvent(event);

        expect(fnB).to.have.been.called.once;

    });

    it(`should not trigger the default action if canceled`, () => {

        let source = {};
        EventSource.setup(source);
        source.declareEvent(`test`);
        source.addEventListener(`test`, e => e.preventDefault());

        let event = new Event(`test`, { cancelable: true });

        let fn = spy(() => {});
        event.setDefault(fn);

        source.dispatchEvent(event);

        expect(fn).to.not.have.been.called();

    });

    it(`should not go up the tree unless requested`, () => {

        let parent = {};
        EventSource.setup(parent);
        parent.declareEvent(`test`);

        let source = {};
        EventSource.setup(source, { dispatchToParent: event => { parent.dispatchEvent(event) } });
        source.declareEvent(`test`);

        let fn = spy(() => {});
        parent.addEventListener(`test`, fn);

        let event = new Event(`test`);
        source.dispatchEvent(event);

        expect(fn).to.not.have.been.called();

    });

    it(`should go up the tree when requested`, () => {

        let parent = {};
        EventSource.setup(parent);
        parent.declareEvent(`test`);

        let source = {};
        EventSource.setup(source, { dispatchToParent: event => { parent.dispatchEvent(event) } });
        source.declareEvent(`test`);

        let event = new Event(`test`, { bubbles: true });

        let fnA = spy(() => {});
        source.addEventListener(`test`, fnA);

        let fnB = spy(() => { expect(fnA).to.have.been.called.with(event) });
        parent.addEventListener(`test`, fnB);

        source.dispatchEvent(event);

        expect(fnB).to.have.been.called.with(event);

    });

    it(`should not go up the tree once the bubbling has been canceled`, () => {

        let parent = {};
        EventSource.setup(parent);
        parent.declareEvent(`test`);

        let source = {};
        EventSource.setup(source, { dispatchToParent: event => { parent.dispatchEvent(event) } });
        source.declareEvent(`test`);

        let event = new Event(`test`, { bubbles: true });

        let fnA = spy(e => { e.stopPropagation() });
        source.addEventListener(`test`, fnA);

        let fnB = spy(() => {});
        parent.addEventListener(`test`, fnB);

        source.dispatchEvent(event);

        expect(fnB).to.not.have.been.called();

    });

});
