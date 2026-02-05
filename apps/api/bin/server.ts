import 'reflect-metadata'
import { Ignitor, prettyPrintError } from '@adonisjs/core'

const APP_ROOT = new URL('../', import.meta.url)

const ignitor = new Ignitor(APP_ROOT, { importer: (filePath) => import(filePath) })

try {
  await ignitor.httpServer().start()
} catch (error) {
  process.exitCode = 1
  prettyPrintError(error)
}
