

let stdout = ChildProcess.execSync('which node');
console.log(`which node stdout: `, stdout)  // TODO DELETE ME

stdout = ChildProcess.execSync('which npm');
console.log(`which npm stdout: `, stdout)  // TODO DELETE ME
