const ChildProcess = require('child_process');

const dorun = cmd => {
    let stdout = ChildProcess.execSync(cmd);
    console.log(`${cmd} stdout: `, stdout.toString())  // TODO DELETE ME
}

dorun('pwd');
dorun('which node');
dorun('which npm');
