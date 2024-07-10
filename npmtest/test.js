// import { dirname } from 'path';
// import { fileURLToPath } from 'url';
// const __dirname = dirname(fileURLToPath(import.meta.url));

console.log(`__dirname: `, __dirname)  // TODO DELETE ME

const ChildProcess = require('node:child_process');
process.chdir(__dirname);

const dorun = cmd => {
    let stdout = ChildProcess.execSync(cmd);
    console.log(`${cmd} stdout: `, stdout.toString())  // TODO DELETE ME
}

dorun('pwd');
dorun('ls -l');
dorun('ls -l ..');
dorun('ls -l ../..');
dorun('which node');
dorun('which npm');
dorun('node --version');
dorun('echo $PATH');
