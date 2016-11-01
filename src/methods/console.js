import 'colors'

export function consoleLog (string) {
  console.log(string.blue)
}

export function consoleInfo (string) {
  console.log(string.green)
}

export function consoleConfig (object) {
  console.log(JSON.stringify(object, null, 2))
}
export function consoleWarn (string) {
  console.warn(string.yellow)
}

export function consoleError (string) {
  console.error(string.red)
}
