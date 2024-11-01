export function hasUndefined(data: any) {
  return Object.values(data).some((value) => value === undefined)
}