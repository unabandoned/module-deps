// concat-stream replacement for the test suite, backed by node:stream.
//
// The suite used concat-stream for exactly one shape — sit at the tail of a
// pipe, buffer everything, hand it back as a single Buffer:
//
//   pack.pipe(concat(function (src) { ... src.toString('utf8') ... }))
//
// concat-stream is unmaintained upstream and drags four transitive packages
// (buffer-from, inherits, readable-stream, typedarray) into the dev tree, one
// of them a major behind. That tree runs in CI alongside publish credentials,
// so it is worth keeping near zero.
//
// index.js already replaced concat-stream inline for the same reason (see the
// note above its own concat()); this is that implementation, shared by the
// tests. Deliberate difference from concat-stream: the callback always gets a
// Buffer, where concat-stream infers the type from the first chunk and hands
// back an empty array when nothing was written. Every call site here does
// .toString('utf8') on the result, so a Buffer is always the right answer.

var stream = require('node:stream');

module.exports = function concat (cb) {
    var chunks = [];
    return new stream.Writable({
        write: function (chunk, enc, next) {
            chunks.push(Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(chunk, enc && enc !== 'buffer' ? enc : 'utf8'));
            next();
        },
        final: function (next) { cb(Buffer.concat(chunks)); next(); }
    });
};
