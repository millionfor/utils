/**
 * @FileName        test
 * @CreatedTime     三,  7 24, 2024 11:16
 * @LastModified    三,  7 24, 2024 11:16
 * @Author          QuanQuan <millionfor@apache.org>
 * @Description     test
 */

const tryToCatch = require('try-catch')

const utils = require('../')

;(async () => {

  const { writeJSON, writeText } = utils

  // const [error] = await tryToCatch(writeJSON.default, 'data.json', { hello: 'world-2222' })

  // if (error) console.error(error.message)

  // const options = {
  //   replacer: ['hello'], // properties to put in json
  //   space: 2, // default space count
  //   eof: true, // default new line at end of file
  //   encoding: 'utf8', // default
  //   flag: 'w', // default
  // }
  // await writeJSON.default('data.json', { hello: 'world11111111111' }, options)

  // try {
  //   writeJSON.sync('data.json', { hello: 'world222-----' })
  // } catch (error) {
  //   console.log(error.message)
  // }

  // writeJSON.syncTry('data.json', {hello: 'worldxx222222x'});


  // await writeText('/Users/gongzijian/workspace/g/npmjs/utils/test/data.md', '我是测试')

  console.log('ok')
})()
