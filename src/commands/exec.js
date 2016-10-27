const childProcess = require('child_process')

module.exports.exec = function () {
  if (typeof this.program.method !== 'string') {
    console.log('You didn\'t specify a method to be called, please use the --method option for that')
    return
  }
  const command = this.program.lang === 'py'
  ? `python ${this.appPythonBinDir} ${this.program.method.replace(/[ ]*,[ ]*|[ ]+/g, ' ')}`
  : this[this.program.method]()
  console.log(
    childProcess.execSync(command).toString('utf-8'))
}
