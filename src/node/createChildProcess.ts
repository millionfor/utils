/**
 * @FileName        createChildProcess
 * @CreatedTime     二,  1 21, 2025 15:45
 * @LastModified    四, 10 30, 2025 21:51:54 CST
 * @Author          QuanQuan <millionfor@apache.org>
 * @Description     在 fork 子进程中执行 Check 任务
 */

import { fork } from 'node:child_process';

export interface CreateThreadOptions<T = Record<string, unknown>> {
  workerFile: string;
  type: string;
  debug?: boolean;
  payload?: T;
}

export interface WorkerMessageBody<T = unknown> {
  type: string;
  data?: T;
  end?: boolean;
}

/** fork 方式创建子进程 */
export function createChildProcess<T>(options: CreateThreadOptions, onMessage?: (d: WorkerMessageBody<T>) => void) {
  const controller = new AbortController();
  const { signal } = controller;
  const worker = fork(options.workerFile, { silent: false, signal });
  let heartbeat = 0;
  let heartbeatTimer: NodeJS.Timeout;
  const exit = () => {
    clearInterval(heartbeatTimer);
    // if (!worker.killed) controller.abort();
    if (!worker.killed) worker.kill();
  };

  worker.send(options);

  const wait = new Promise<T>((resolve, reject) => {
    worker.on('message', (info: WorkerMessageBody<T>) => {
      if (typeof info === 'string') info = JSON.parse(info);
      if (options.debug) console.log('received from child proc:', info);

      if (info.type === 'pong') {
        if (heartbeat === 0) {
          heartbeatTimer = setInterval(() => worker.send({ type: 'ping' }), 5000);
        }
        heartbeat++;
        return;
      }

      if (onMessage) onMessage(info);

      if (info.end) {
        resolve(info.data as never as T);
        exit();
      }
    });

    worker.on('error', error => console.log(`[worker][${options.type}]err:`, error));
    worker.on('exit', code => {
      if (options.debug) console.log(`[worker][${options.type}]exit worker`, code);
      if (code !== 0) reject(code);
      exit();
    });

    if (options.debug) {
      worker.once('close', code => console.log(`[worker][${options.type}]Child exited with code ${code}`));
    }
  });

  return { worker, wait, controller };
}

let loaded = false;
const exit = (data: unknown) => {
  process.send!({ data, end: true } as WorkerMessageBody);
  process.exit(0);
};

/** worker init: use in child process */
export function childProcessInit(onmessage: (msg: CreateThreadOptions) => void) {
  if (loaded) return { exit };
  loaded = true;

  process.on('message', (config: CreateThreadOptions) => {
    console.log('[received]msg', config);

    // heartbeat
    if (config.type === 'ping') {
      process.send!({ type: 'pong' });
      return;
    }

    onmessage(config);
  });

  // 立即发送一次心跳
  process.send!({ type: 'pong' });

  return { exit };
}


// vim: set ft=typescript fdm=marker et ff=unix tw=120 sw=2:
