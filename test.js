const compare = require('./compare')

compare('file1.txt', 'file2.txt', (err, result) => {
    if (err) {
        console.error(err);
    } else {
        console.log(result);
    }
});