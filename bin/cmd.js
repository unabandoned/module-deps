#!/usr/bin/env node
var mdeps = require('../');
var subarg = require('../lib/subarg');
var fs = require('fs');
var path = require('path');

var argv = subarg(process.argv.slice(2), {
    alias: { h: 'help', t: 'transform', g: 'globalTransform' }
});
if (argv.help) return usage(0);

var JSONStream = require('JSONStream');

// `-t [ ./tr.js --presets es2015 ]` parses into a nested argv object
// `{ _: ['./tr.js'], presets: 'es2015' }`, but the library only understands a
// bare id or a `[ id, opts ]` pair — it hands anything else straight to
// resolve(), which throws "Path must be a string". Translate here so the
// bracket syntax the browserify CLI ecosystem uses actually works.
argv.transform = normalizeTransforms(argv.transform);
argv.globalTransform = normalizeTransforms(argv.globalTransform);
argv.t = argv.transform;
argv.g = argv.globalTransform;

var files = argv._.map(function (file) {
    if (file === '-') return process.stdin;
    return path.resolve(file);
});
var md = mdeps(argv);
md.pipe(JSONStream.stringify()).pipe(process.stdout);

files.forEach(function (file) { md.write(file) });
md.end();

// Always returns an array. The library flattens one level with
// `[].concat(opts.transform)`, so a lone `[ id, opts ]` pair must stay wrapped
// or it would flatten into two separate transforms.
function normalizeTransforms (tr) {
    if (tr === undefined) return [];
    return [].concat(tr).filter(Boolean).map(toTransform).filter(Boolean);
}

function toTransform (tr) {
    if (!isSubargv(tr)) return tr;

    var positional = tr._;
    var id = positional[0];
    if (id === undefined) return null; // `-t [ ]` — nothing to load

    var opts = {};
    Object.keys(tr).forEach(function (key) {
        if (key !== '_') opts[key] = tr[key];
    });
    // Preserve any extra positional arguments inside the brackets.
    if (positional.length > 1) opts._ = positional.slice(1);

    return [ id, opts ];
}

function isSubargv (tr) {
    return tr && typeof tr === 'object' && !Array.isArray(tr)
        && Array.isArray(tr._);
}

function usage (code) {
    var r = fs.createReadStream(__dirname + '/usage.txt');
    r.pipe(process.stdout);
    if (code) r.on('end', function () { process.exit(code) });
}
