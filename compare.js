'use strict';

/*  Usage:

    CLI mode:
    node compare.js file1 file2 

    Module mode:
    const compare = require('./compare');
    compare(file1,file2, callback)
    -- callback will be called on comparison result
*/

const fs = require('fs');

const CLI_MODE = require.main === module;

let result = [];
let callback;

// Handles different lines
const differentLines = (line1, line2) => result.push(['*', `${line1}|${line2}`]);

// Handles same lines
const sameLines = (line) => result.push([' ', line]);

// Handles deleted lines
const deletedLines = (lines) => lines.forEach(line => result.push(['-', line]));

// Handles added lines
const addedLines = (lines) => lines.forEach(line => result.push(['+', line]));

// Handles adjusted lines
const adjustedLines = (part1, part2) => {
    let i;
    for (i = 0; i < part1.length - 1 && i < part2.length - 1; i++) {
        let l = part2[i];
        if (l) {
            differentLines(part1[i], l)
        } else {
            break;
        }
    }
    deletedLines(part1.slice(i, part1.length - 1));
    addedLines(part2.slice(i, part2.length - 1));
    sameLines(part1[part1.length - 1]);
};

/*  Throws if wrong number of params or no callback for Module mode.
*/
const checkArgs = (args) => {
    if (CLI_MODE) {
        if (args.length !== 2) throw new Error(`Expected 2 files; got: ${args.length}`);
        return args;
    } else {
        if (args.length !== 3 ||
            typeof args[0] !== 'string' ||
            typeof args[1] !== 'string' ||
            typeof args[2] !== 'function') {
            throw new Error(`Expected 2 files and a callback`);
        }
        callback = args[2];
        return args.slice(0, 2);
    }
};

/*  Reads and splits files by lines.
    Returns array of arrays of files' lines. 
*/
const readFiles = (files) => {
    let fileOneLines = fs.readFileSync(files[0]).toString().split('\n');
    let fileTwoLines = fs.readFileSync(files[1]).toString().split('\n');
    return [fileOneLines, fileTwoLines];
};

/*  Compares files by line
 */
const compareFiles = (files) => {
    let fromIndex = 0;

    let part1 = [];
    let part2 = [];

    for (let line of files[0]) {
        let idx = files[1].indexOf(line, fromIndex);
        if (idx == -1) {
            part1.push(line);
        } else {
            part1.push(line);
            part2 = files[1].slice(fromIndex, idx + 1);
            fromIndex = idx + 1;
            adjustedLines(part1, part2);
            part1 = [];
            part2 = [];
        }
    }
    deletedLines(part1);
    addedLines(files[1].slice(fromIndex));

    return result.reduce((acc,cur,idx) => 
                                acc += [idx + 1, ...cur].join('\t') 
                                + (idx === result.length - 1 ? '' : '\n')
                         ,'');
};

const pipe = (...fns) => (args) => fns.reduceRight((v, f) => f(v), args);

if (CLI_MODE) {
    try {
        console.log(pipe(compareFiles, readFiles, checkArgs)(process.argv.splice(2)));
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
} else {
    module.exports = function (...args) {
        try {
            let result = pipe(compareFiles, readFiles, checkArgs)(args);
            callback(null, result);
        } catch (err) {
            if(!callback) {
                throw new Error(err);
            } else {
                callback(err);
            }
        }
    }
}