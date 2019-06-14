#!/usr/bin/env node
'use strict'
const meow = require('meow')
const researchNetwork = require('./api')

const cli = meow(
  `
Usage
  $ research-network <url>

Options
  --help,-h             Show help.
  --device, -d          Select device. pc, sp.
  --resource, -r        Select research resource. all, xhf, fetch, script, image etc
  --sort, -s            Sort by orderKey. default resource download time. time, end, start, size etc
  --order, -o           Order by ASC or DESC. default DESC. DESC or ASC.
  --proxyserver, -p     Proxy server config.
  --maxsize             Color download size. 300KB is default.
  --maxtime             Color download time. 500ms is default.

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
        default: 'all'
      },
      sort: {
        type: 'string',
        alias: 's',
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
      },
      order: {
        type: 'string',
        alias: 'o',
        default: 'DESC'
      },
      maxsize: {
        type: 'string'
      },
      maxtime: {
        type: 'string'
      }
    }
  }
)

if (cli.input.length === 0 || cli.flags.help) {
  cli.showHelp()
  process.exit()
}
researchNetwork(cli.input[0], cli.flags)
