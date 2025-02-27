
const { childProcessInit } = require('../')

const { exit } = childProcessInit(async (config) => {
  console.log('[worker] received config:', config)

  if (config.type === 'task') {
    const { input } = config.payload

    // 模拟一个耗时的操作
    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      process?.send({ type: 'progress', data: i * 20 })
    }

    const result = `Processed: ${input} - worker complete`
    exit(result)
  }

  if (config.type === 'other-task') {
    const { name } = config.payload

    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
    exit(100) // 模拟返回一个数字
  }
})
