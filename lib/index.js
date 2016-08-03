/**
 * SUGOS example project to contorl RAPIRO.
 * @module sugo-example-rapiro
 */

'use strict'

let d = (module) => module.default || module

module.exports = {
  get actor () { return d(require('./actor')) },
  get caller () { return d(require('./caller')) },
  get hub () { return d(require('./hub')) },
  get configs () { return d(require('./configs')) },
  get ui () { return d(require('./ui')) }
}
