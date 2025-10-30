import * as fs from 'fs'
import * as path from 'path'
import { QLogger } from '../src/node/libs/QLogger'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

describe('QLogger file write', () => {
  const tmpDir = path.resolve(process.cwd(), '.tmp-logs-nlogger')

  beforeAll(() => {
    if (fs.existsSync(tmpDir)) {
      if (!process.env.KEEP_NLOGGER_LOGS) {
        fs.rmSync(tmpDir, { recursive: true, force: true })
      }
    }
    fs.mkdirSync(tmpDir, { recursive: true })
  })

  afterAll(() => {
    if (fs.existsSync(tmpDir) && !process.env.KEEP_NLOGGER_LOGS) {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  test('should create log file and write content', async () => {
    const tag = 'TestQLogger'
    const logger = QLogger.getLogger(tag, { logDir: tmpDir, levelType: 'info' })

    const message = 'hello-qlogger-file'
    logger.info(message)

    // wait stream write flush
    await sleep(50)

    const curTime = new Date().toISOString().slice(0, 10).replace(/\D/g, '')
    const filename = `${tag}_${curTime}.log`
    const filePath = path.join(tmpDir, filename)

    expect(fs.existsSync(filePath)).toBe(true)
    const content = fs.readFileSync(filePath, 'utf8')
    expect(content).toContain(message)
  })
})


