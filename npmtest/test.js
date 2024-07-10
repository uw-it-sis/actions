const ChildProcess = require('child_process');

let stdout = ChildProcess.execSync('which node');
console.log(`which node stdout: `, stdout.toString())  // TODO DELETE ME

stdout = ChildProcess.execSync('which npm');
console.log(`which npm stdout: `, stdout.toString())  // TODO DELETE ME
