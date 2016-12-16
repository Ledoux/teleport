import 'colors'

export function consoleLog (string) {
  if (string) {
    console.log(string.blue)
  } else {
    console.warn(`your string to console is not correct: ${string}`)
  }
}

export function consoleInfo (string) {
  if (string) {
    console.log(string.green)
  } else {
    console.warn(`your string to console is not correct: ${string}`)
  }
}

export function consoleConfig (object) {
  console.log(JSON.stringify(object, null, 2))
}
export function consoleWarn (string) {
  if (string) {
    console.warn(string.yellow)
  } else {
    console.warn(`your string to console is not correct: ${string}`)
  }
}

export function consoleError (string) {
  if (string) {
    console.error(string.red)
  }
}
