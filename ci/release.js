#!/usr/bin/env node

/**
 * Release this package.
 */

'use strict'

process.chdir(`${__dirname}/..`)

const { release } = require('sugo-ci-example')

release({
  beforeRelease: [
    './ci/build.js',
    './ci/ghpages.js',
    './ci/heroku.js',
    './ci/test.js'
  ]
})
