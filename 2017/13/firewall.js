const { mapValues, keyBy } = require('lodash');

class Layer {
    constructor(range = 0) {
        this.range = range;

        this.scanner = null;
        this.direction = null;

        if (this.range > 0) {
            // Initialize the scanner at position 0, going down (+1)
            this.scanner = 0;
            this.direction = 1;
        }
    }

    tick() {
        if (this.range > 0) {
            this.scanner += this.direction;

            // If we are at the end, or are at the beginning, the flip the direction
            if (
                (this.direction === 1 && this.scanner === this.range - 1) ||
                (this.direction === -1 && this.scanner === 0)
            ) {
                this.direction *= -1;
            }
        }

        return this.scanner;
    }
}

class Firewall {
    constructor(layers_orig) {
        // Poor man's deep clone
        let layers = JSON.parse(JSON.stringify(layers_orig));

        let max_depth = this.getMaxDepth(layers);
        let layers_lookup = this.convertLayersArrayToMap(layers);

        // `max_depth + 1` because the layers are zero-indexed
        this.layers = Array(max_depth + 1)
            .fill()
            .map((layer, depth) => new Layer(layers_lookup[depth]));
    }

    getMaxDepth(layers) {
        return Math.max.apply(null, layers.map(l => l.depth));
    }

    /**
     * @param {Array} layers - Array of { depth, range } objects
     * @returns {Object} - Returns an object, keyed by `depth`, with its value as the `range`
     */
    convertLayersArrayToMap(layers) {
        return mapValues(keyBy(layers, 'depth'), 'range');
    }

    moveThrough(checkPosition = 0) {
        let times_caught = [];
        this.layers.forEach((layer, time) => {
            /**
             * First, particle enters (determined by `time`),
             * so we see if the layer at `time` has the scanner
             * in position `0`. If so, push a "time_caught"
             * to our tracker array, with `time` multiplied
             * by the layers `range`.
             */
            if (layer.scanner === checkPosition) {
                times_caught.push(time * layer.range);
            }

            // Next, tick all layers' scanners forward
            this.tickAll();
        });

        return times_caught.reduce((a, b) => a + b, 0);
    }

    tickAll(n = 1) {
        for (let i = 0; i < n; i++) {
            this.layers.forEach(l => l.tick());
        }
    }
}

module.exports = Firewall;
