// We want to test the vanilla one

var fs = require('fs');

contents = fs.readFileSync('./src/PromiseFSM.js', 'utf8');
eval(contents);

module.exports = PromiseFSM;