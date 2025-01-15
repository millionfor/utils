/**
 * @FileName        writeText
 * @CreatedTime     五,  7 26, 2024 17:11
 * @LastModified    五,  7 26, 2024 17:11
 * @Author          QuanQuan <millionfor@apache.org>
 * @Description     writeText
 */

import * as fs from 'fs'
import * as path from 'path'

/**
 * writeText.
 *
 * @param filePath -
 * @param content -
 * @returns
 */
export const writeText = (filePath: string, content: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const dirPath = path.dirname(filePath)
    fs.mkdir(dirPath, { recursive: true }, (err) => {
      if (err) {
        reject(err)
      } else {
        fs.writeFile(filePath, content, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      }
    })
  })
}
