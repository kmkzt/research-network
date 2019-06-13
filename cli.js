#!/usr/bin/env node
'use strict'
const meow = require('meow')
const researchNetwork = require('./api')

const cli = meow(
  `
Usage
  $ research-network <url>

Options
  --help,-h             show help
  --device, -d          device
  --resource, -r        all, xhf, fetch, script, image etc
  --order, -o           order
  --proxyserver, -p     set proxy server

Examples
  $ research-network https://google.com
`,
  {
    flags: {
      device: {
        type: 'string',
        alias: 'd',
        default: 'pc'
      },
      resource: {
        type: 'string',
        alias: 'r',
        default: 'xhr,fetch'
      },
      order: {
        type: 'string',
        alias: 'o',
        default: 'time'
      },
      help: {
        type: 'boolean',
        alias: 'h',
        default: false
      },
      proxyserver: {
        type: 'string',
        alias: 'p',
        default: undefined
      }
    }
  }
)

if (cli.input.length === 0 || cli.flags.help) {
  cli.showHelp()
  process.exit()
}
researchNetwork(cli.input[0], cli.flags)
