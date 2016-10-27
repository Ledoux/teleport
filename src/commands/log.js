module.exports.log = function () {
  if (typeof this.program.method !== 'string') {
    console.log('You need to mention a method with the --method option')
    return
  }
  const log = this[this.program.method](this.kwarg)
  console.log(log)
}
