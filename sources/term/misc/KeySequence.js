class KeySequenceEntry {

    static parse(string) {

        let entry = new KeySequenceEntry();

        for (let part of string.split(/[+-]/g)) {

            switch (part) {

                case `shift`:
                case `S`: {
                    entry.shift = true;
                } break;

                case `alt`:
                case `A`: {
                    entry.alt = true;
                } break;

                case `ctrl`:
                case `C`: {
                    entry.ctrl = true;
                } break;

                case `meta`:
                case `M`: {
                    entry.meta = true;
                } break;

                default: {
                    entry.key = part;
                } break;

            }

        }

        return entry;

    }

    constructor() {

        this.shift = false;
        this.alt = false;
        this.ctrl = false;
        this.meta = false;

        this.key = null;

    }

    check(key) {

        if (this.shift !== key.shift)
            return false;

        if (this.alt !== key.alt)
            return false;

        if (this.ctrl !== key.ctrl)
            return false;

        if (this.meta !== key.meta)
            return false;

        if (this.key !== key.name)
            return false;

        return true;

    }

};

export class KeySequence {

    constructor(sequence) {

        this.keyBuffer = [];

        this.entries = String(sequence).trim().split(/\s+/g).map(descriptor => KeySequenceEntry.parse(descriptor.trim()));

    }

    add(key) {

        this.keyBuffer.push(key);

        // Remove any extraneous key (we only match the last Nth keys)
        if (this.keyBuffer.length > this.entries.length)
            this.keyBuffer.splice(0, this.keyBuffer.length - this.entries.length);

        // Early return if we haven't buffered enough keys to match anyway
        if (this.keyBuffer.length < this.entries.length)
            return false;

        // Check that every buffered key match its corresponding entry
        for (let t = 0, T = this.entries.length; t < T; ++t)
            if (!this.entries[t].check(this.keyBuffer[t]))
                return false;

        return true;

    }

}
