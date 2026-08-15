// Vendored from substack/subarg@1.0.0 (MIT, James Halliday) — see LICENSE.
//
// subarg is a 35-line leaf whose only job is to pre-chunk `[ ... ]` groups out
// of argv and recurse into them, handing everything else to minimist. It is
// abandoned upstream, and its sole dependency (minimist) is a zero-dependency
// leaf we can depend on directly, so carrying the package bought us nothing but
// an unmaintained hop in the runtime tree. Vendoring it drops that hop without
// losing the bracket syntax the browserify CLI ecosystem uses for transform
// options (`-t [ babelify --presets es2015 ]`).
//
// Kept byte-for-byte faithful to upstream behaviour: bracket groups parse into
// a nested argv object `{ _: [name], ...opts }`. bin/cmd.js is responsible for
// translating that shape into the `[ name, opts ]` pairs module-deps consumes.

var minimist = require('minimist');

module.exports = function parse (args, opts) {
    var level = 0, index;
    var args_ = [];

    for (var i = 0; i < args.length; i++) {
        if (typeof args[i] === 'string' && /^\[/.test(args[i])) {
            if (level ++ === 0) {
                index = i;
            }
        }
        if (typeof args[i] === 'string' && /\]$/.test(args[i])) {
            if (-- level > 0) continue;

            var sub = args.slice(index, i + 1);
            if (typeof sub[0] === 'string') {
                sub[0] = sub[0].replace(/^\[/, '');
            }
            if (sub[0] === '') sub.shift();

            var n = sub.length - 1;
            if (typeof sub[n] === 'string') {
                sub[n] = sub[n].replace(/\]$/, '');
            }
            if (sub[n] === '') sub.pop();

            args_.push(parse(sub));
        }
        else if (level === 0) args_.push(args[i]);
    }

    var argv = minimist(args_, opts);
    return argv;
};
