/**
 * Work done in idle time, one engine's at a time: sort ranks and search
 * index columns prepared before they are asked for. Each task advances in
 * small steps (a few thousand rows), and the worker takes steps only while
 * the idle deadline leaves time, so it never makes a long task. A new
 * request replaces the tasks still waiting; a task finished meanwhile (the
 * user sorted first) is skipped. Without `requestIdleCallback` (server
 * rendering, tests) nothing runs ahead: the work happens when asked for.
 */

type IdleTask = {
  /** Whether there is nothing left to do (also when done by other means). */
  done: () => boolean
  /** Does one small step. */
  step: () => void
}

type IdleWorker = {
  request: (tasks: ReadonlyArray<IdleTask>) => void
}

// The deadline's last milliseconds are left to the browser.
const MARGIN = 1

function createIdleWorker(): IdleWorker {
  let queue: Array<IdleTask> = []
  let scheduled = false
  const work = (deadline: IdleDeadline) => {
    scheduled = false
    while (queue.length && deadline.timeRemaining() > MARGIN) {
      const task = queue[0]
      if (task.done()) queue.shift()
      else task.step()
    }
    while (queue.length && queue[0].done()) queue.shift()
    if (queue.length) schedule()
  }
  const schedule = () => {
    if (scheduled || typeof requestIdleCallback === "undefined") return
    scheduled = true
    requestIdleCallback(work)
  }
  return {
    request(tasks) {
      queue = tasks.filter((task) => !task.done())
      if (queue.length) schedule()
    },
  }
}

export { createIdleWorker }
export type { IdleTask, IdleWorker }
