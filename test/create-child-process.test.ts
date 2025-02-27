import { createChildProcess, CreateThreadOptions, WorkerMessageBody } from '../src/node/createChildProcess'

import * as path from 'path'

async function main() {
  // 创建一个处理任务的子进程
  const taskOptions: CreateThreadOptions<{ input: string }> = {
    workerFile: path.join(__dirname, 'worker.ts'),
    type: 'task',
    debug: true,
    payload: { input: 'Hello from parent!' }
  }

  const taskProcess = createChildProcess<string>(taskOptions, (message: WorkerMessageBody<string>) => {
    console.log('[parent] received from worker:', message)
    if (message.type === 'progress') {
      // 处理进度消息
      console.log('[parent] progress:', message.data)
    }
  })

  if (taskProcess) {
    try {
      const result = await taskProcess.wait
      console.log('[parent] task completed, result:', result)
    } catch (error) {
      console.error('[parent] task failed:', error)
    }
  }

  // 创建另一个子进程做一些其他事情
  const otherTaskOptions: CreateThreadOptions<{ name: string }> = {
    workerFile: path.join(__dirname, 'worker.ts'),
    type: 'other-task',
    debug: true,
    payload: { name: 'other worker' }
  }

  const otherTaskProcess = createChildProcess<number>(otherTaskOptions, (message: WorkerMessageBody<number>) => {
    console.log('[parent] received from other worker:', message)
  })

  if (otherTaskProcess) {
    try {
      const result = await otherTaskProcess.wait
      console.log('[parent] other task completed, result:', result)
    } catch (error) {
      console.error('[parent] other task failed:', error)
    }
  }
}

main()
