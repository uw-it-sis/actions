// import { dirname } from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = dirname(fileURLToPath(import.meta.url));

console.log(`__dirname: `, __dirname)  // TODO DELETE ME

const ChildProcess = require('child_process');

const dorun = cmd => {
    let stdout = ChildProcess.execSync(cmd);
    console.log(`${cmd} stdout: `, stdout.toString())  // TODO DELETE ME
}

dorun('pwd');
dorun('ls -l ..');
dorun('ls -l ../..');
dorun('which node');
dorun('which npm');
