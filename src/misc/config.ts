import { randomBytes } from 'crypto'
import { existsSync, readFileSync, writeFileSync } from 'fs-extra'
import path from 'path'
import { DI_ARGV } from '../constants'
import { inject } from '../manager'

type Instance = ReturnType<typeof generateInstance>
let firstRun = false
let instance: Instance | null = null

function generateInstance () {
  return {
    id: randomBytes(20).toString('hex')
  }
}

function loadInstance (): Instance {
  const { dataDir } = inject<{ dataDir: string }>(DI_ARGV).get()
  const instancePath = path.join(dataDir, '.instance.json')
  if (!existsSync(instancePath)) {
    firstRun = true
    const instance = generateInstance()
    writeFileSync(instancePath, JSON.stringify(instance))
    return instance
  } else {
    return JSON.parse(readFileSync(instancePath).toString())
  }
}

export function isFirstRun () {
  getInstance()
  return firstRun
}

export function getInstance () {
  return instance ?? (instance = loadInstance())
}

export function getInstanceId () {
  return Buffer.from(getInstance().id, 'hex')
}
