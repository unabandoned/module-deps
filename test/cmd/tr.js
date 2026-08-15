var Transform = require('node:stream').Transform;

// Reports the options it was handed on stderr so the CLI tests can assert on
// how bin/cmd.js translated the command line.
module.exports = function (file, opts) {
    var seen = {};
    Object.keys(opts).forEach(function (key) {
        if (key !== '_flags') seen[key] = opts[key];
    });
    console.error('TRANSFORM ' + JSON.stringify(seen));
    return new Transform({ transform: function (chunk, enc, cb) { cb(null, chunk) } });
};
