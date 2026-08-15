var test = require('./tap-adapter').test;
var spawn = require('child_process').spawn;
var path = require('path');

var CMD = path.join(__dirname, '../bin/cmd.js');
var MAIN = path.join(__dirname, 'cmd/main.js');
var TR = path.join(__dirname, 'cmd/tr.js');

function run (args, cb) {
    var ps = spawn(process.execPath, [ CMD ].concat(args));
    var out = '', err = '';
    ps.stdout.on('data', function (buf) { out += buf });
    ps.stderr.on('data', function (buf) { err += buf });
    ps.on('close', function (code) {
        cb(code, out, err);
    });
}

// Every `TRANSFORM {...}` line the fixture transform wrote to stderr.
function transformOpts (err) {
    return err.split('\n')
        .filter(function (line) { return /^TRANSFORM /.test(line) })
        .map(function (line) { return JSON.parse(line.slice('TRANSFORM '.length)) })
    ;
}

test('cmd: bare transform id', function (t) {
    t.plan(3);
    run([ MAIN, '-t', TR ], function (code, out, err) {
        t.equal(code, 0, 'exits 0');
        t.deepEqual(transformOpts(err), [ {} ], 'transform ran with no options');
        t.equal(JSON.parse(out).length, 1, 'one row of output');
    });
});

test('cmd: bracketed transform passes options through', function (t) {
    t.plan(3);
    run([ MAIN, '-t', '[', TR, '--presets', 'es2015', ']' ], function (code, out, err) {
        t.equal(code, 0, 'exits 0');
        t.deepEqual(transformOpts(err), [ { presets: 'es2015' } ], 'options reached the transform');
        t.equal(JSON.parse(out).length, 1, 'one row of output');
    });
});

test('cmd: bracketed global transform passes options through', function (t) {
    t.plan(2);
    run([ MAIN, '-g', '[', TR, '--level', '3', ']' ], function (code, out, err) {
        t.equal(code, 0, 'exits 0');
        t.deepEqual(transformOpts(err), [ { level: 3 } ], 'options reached the global transform');
    });
});

// A lone `[ id, opts ]` pair must not flatten into two transforms, and two
// bracketed transforms must each keep their own options. The order the
// transforms are constructed in is not part of that guarantee, so compare
// without it.
test('cmd: two bracketed transforms stay distinct', function (t) {
    t.plan(2);
    var args = [ MAIN, '-t', '[', TR, '--x', '1', ']', '-t', '[', TR, '--y', '2', ']' ];
    run(args, function (code, out, err) {
        t.equal(code, 0, 'exits 0');
        var seen = transformOpts(err).map(function (o) { return JSON.stringify(o) }).sort();
        t.deepEqual(seen, [ '{"x":1}', '{"y":2}' ], 'each transform kept its own options');
    });
});

test('cmd: extra positional args inside brackets are preserved', function (t) {
    t.plan(2);
    run([ MAIN, '-t', '[', TR, 'extra', '--x', '1', ']' ], function (code, out, err) {
        t.equal(code, 0, 'exits 0');
        t.deepEqual(transformOpts(err), [ { x: 1, _: [ 'extra' ] } ], 'extra positionals kept');
    });
});

test('cmd: no transform', function (t) {
    t.plan(2);
    run([ MAIN ], function (code, out, err) {
        t.equal(code, 0, 'exits 0');
        t.equal(transformOpts(err).length, 0, 'no transform ran');
    });
});
