import chalk from 'chalk'
import { randomBytesAsync } from './async'

export async function generateToken () {
  return randomBytesAsync(20).then(b => b.toString('hex'))
}

const FN_ARGS = /^\s*[^(]*\(\s*([^)]*)\)/m
const FN_ARG_SPLIT = /,/
// const FN_ARG = /^\s*(_?)(.+?)\1\s*$/
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg
export function getParamnames (fn: Function) {
  const fnText = fn.toString().replace(STRIP_COMMENTS, '')
  const argDecl = fnText.match(FN_ARGS)!
  return argDecl[1].split(FN_ARG_SPLIT).map(x => x.trim())
}

export function addLineNumbers (str: string) {
  const lines = str.split('\n')
  const width = lines.length.toString().length
  for (let i = 0; i < lines.length; i++) {
    lines[i] = `${chalk.cyan((i + 1).toString().padStart(width))} ${lines[i]}`
  }
  return lines.join('\n')
}

export function optionalSet<T extends {}, K extends keyof T> (obj: T, key: K, val?: T[K]) {
  if (val !== undefined) obj[key] = val
}

export type JSONSchemaType = 'string' | 'integer' | 'number' | 'object' | 'array' | 'boolean' | 'null'

export function JSONSchemaTypeName (type: Function): JSONSchemaType {
  switch (type) {
    case String: return 'string'
    case Number: return 'number'
    case Object: return 'object'
    case Boolean: return 'boolean'
  }
  return 'null'
}
