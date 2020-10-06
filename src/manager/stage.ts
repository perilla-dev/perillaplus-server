import chalk from 'chalk'

enum StageState {
  PENDING, // Pending execution
  WAITING, // Waiting for dependencies
  RUNNING, // Running
  DONE // Done
}

const stages = new Map<symbol, Stage>()
const executors = new WeakMap<Stage, Function>()

class Step {
  private _name
  private _action
  constructor (action: Function, name?: string) {
    this._name = name ?? action.name
    this._action = action
  }

  async run () {
    if (this._name) {
      console.group(chalk.blueBright(`-> step ${this._name}`))
    } else {
      console.group(chalk.blueBright('-> step <anonymous>'))
    }
    await this._action()
    console.groupEnd()
  }
}

class Stage {
  private _state
  private _name
  private _steps
  private _deps

  constructor (name: string) {
    this._name = name
    this._steps = <Step[]>[]
    this._state = StageState.PENDING
    this._deps = new Set<symbol>()
    executors.set(this, this._run.bind(this))
  }

  step (action: Function, name?: string) {
    this._steps.push(new Step(action, name))
    return this
  }

  dep (s: symbol) {
    this._deps.add(s)
    return this
  }

  private async _run () {
    if (this._state !== StageState.PENDING) return
    this._state = StageState.WAITING
    for (const dep of this._deps) {
      const stage = stages.get(dep)
      // @ts-ignore
      if (!stage) throw new Error(`Dependency ${dep.description} not found!`)
      if (stage._state === StageState.DONE) continue
      if (stage._state === StageState.WAITING) throw new Error(`Circular dependency ${this._name} <-> ${stage._name}!`)
      // TODO: implement parallel stage execution
      // if (stage.state === StageState.RUNNING)
      await stage._run()
    }
    console.group(chalk.blue(`=> stage ${this._name}`))
    this._state = StageState.RUNNING
    for (const step of this._steps) {
      await step.run()
    }
    console.groupEnd()
    this._state = StageState.DONE
  }
}

export async function execute (stage: symbol) {
  await executors.get(stages.get(stage)!)!()
}

export function stage (s: symbol) {
  if (stages.has(s)) return stages.get(s)!
  // @ts-ignore
  const stage = new Stage(s.description)
  stages.set(s, stage)
  return stage
}
