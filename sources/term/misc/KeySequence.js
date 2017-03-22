class KeySequenceEntry {

    static parse(string) {

        let entry = new KeySequenceEntry();
        let parts = string.split(/[+-]/g);

        for (let t = 0; t < parts.length; ++t) {

            let part = parts[t];

            if (t !== parts.length - 1) {

                switch (part.toLowerCase()) {

                    case `shift`:
                    case `s`: {
                        entry.shift = true;
                    } break;

                    case `alt`:
                    case `a`: {
                        entry.alt = true;
                    } break;

                    case `ctrl`:
                    case `c`: {
                        entry.ctrl = true;
                    } break;

                    case `meta`:
                    case `m`: {
                        entry.meta = true;
                    } break;

                    default: {
                        throw new Error(`Failed to parse shortcut descriptor: Invalid modifier "${part}".`);
                    } break;

                }

            } else {

                entry.key = part;

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

    constructor(descriptor) {

        this.keyBuffer = [];

        this.descriptor = descriptor;
        this.entries = String(this.descriptor).trim().toLowerCase().split(/\s+/g).map(descriptor => KeySequenceEntry.parse(descriptor.trim()));

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
