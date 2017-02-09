
export function version () {
  const { project: { package: { version } } } = this
  console.log(version)
}
