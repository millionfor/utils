/**
 * @FileName        rm
 * @CreatedTime     三,  7 24, 2024 16:04
 * @LastModified    三,  7 24, 2024 16:04
 * @Author          QuanQuan <millionfor@apache.org>
 * @Description     rm
 */

import * as fs from 'fs'

/**
 * rmDir.
 *
 * @param path -
 * @returns Promise -
 */
export const rmDirFile = (path: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((file) => {
        const curPath = `${path}/${file}`
        if (fs.lstatSync(curPath).isDirectory()) {
          rmDirFile(curPath)
            .then(() => {
              fs.rmdirSync(curPath)
            })
            .catch((err) => {
              reject(err)
            })
        } else {
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(path)
      resolve()
    } else {
      resolve()
    }
  })
}
