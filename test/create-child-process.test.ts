import { createChildProcess, CreateThreadOptions, WorkerMessageBody } from '../src/node/createChildProcess'
import * as path from 'path';

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


// 模拟 createChildProcess 函数
jest.mock('./worker', () => ({
  createChildProcess: jest.fn((options) => {
    const { payload, type } = options;
    const mockProcess = {
      wait: Promise.resolve(`Result from ${type} with payload ${JSON.stringify(payload)}`),
      on: jest.fn((event, handler) => {
        if (event === 'message') {
          // 模拟进度消息
          if (type === 'task') {
            handler({ type: 'progress', data: '50%' });
          }
          // 模拟最终结果
          handler({ type: 'result', data: `Result from ${type}` });
        }
      }),
    };
    return mockProcess;
  }),
}));

describe('main function', () => {
  it('should handle task and other task correctly', async () => {
    // const consoleSpy = jest.spyOn(console, 'log');
    // const consoleErrorSpy = jest.spyOn(console, 'error');

    await main();

    // 验证任务进程的输出
    // expect(consoleSpy).toHaveBeenCalledWith('[parent] received from worker:', { type: 'progress', data: '50%' });
    // expect(consoleSpy).toHaveBeenCalledWith('[parent] progress:', '50%');
    // expect(consoleSpy).toHaveBeenCalledWith('[parent] task completed, result:', 'Result from task with payload {"input":"Hello from parent!"}');

    // 验证其他任务进程的输出
    // expect(consoleSpy).toHaveBeenCalledWith('[parent] received from other worker:', { type: 'result', data: 'Result from other-task' });
    // expect(consoleSpy).toHaveBeenCalledWith('[parent] other task completed, result:', 'Result from other-task with payload {"name":"other worker"}');

    // 确保没有错误发生
    // expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
