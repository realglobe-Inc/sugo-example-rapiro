/**
 * Get configurations
 * @function configs
 * @returns {Object}
 */
'use strict'

const pkg = require('../package.json')
const { nameColorizer } = require('apemancolor').colorizers

module.exports = function configs () {
  let { PORT, HOSTNAME, STORAGE, CONTENTS } = process.env

  let hostname = HOSTNAME || 'localhost'
  let port = PORT || (hostname === 'localhost' ? 3000 : 80)
  let storage = STORAGE || 'tmp/storage'
  let contents = CONTENTS || 'tmp/contents'

  let color = nameColorizer('#3A8')(pkg.name)

  return {
    /** Host name of hub server */
    hostname,
    /** Port number of hub server */
    port,
    /** Storage of hub server */
    storage,
    /** Dominant ui color */
    color,
    /** Directory for vars */
    contents
  }
}
