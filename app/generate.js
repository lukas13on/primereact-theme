const { exec } = require('child_process');
const command = 'sass --watch src/app/theme.scss output.css'
exec(command, (err, stdout, stderr) => {
  if (err) {
    console.log('err', err)
    // node couldn't execute the command
    return;
  }

  // the *entire* stdout and stderr (buffered)
  console.log(`stdout: ${stdout}`);
  console.log(`stderr: ${stderr}`);
});