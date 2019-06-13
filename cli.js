#!/usr/bin/env node
'use strict';
const puppeteer = require('puppeteer')
const meow = require('meow');

const { UA_CHROME, UA_CHROME_MOBILE } = require('./constants/useragent.js')
const {
  VIEWPORT_PC_DEFAULT,
  VIEWPORT_SP_DEFAULT
} = require('./constants/viewport.js')

const cli = meow(`
Usage
  $ research-network <url>

Options
  --device, -d  device
  --resource, -r  xhf, fetch, script, image etc
  --order, -o

Examples
  $ research-network https://google.com
`, {
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
  }
}
});
/**
 * CAPTURE CLI OPTION
 * --url: capute url
 * --path: capture image dist path
 *
 */
const targetUrl = cli.input[0]
const device = cli.flags.device
const reso = cli.flags.resource // Request.ResourceType >> xhf, fetch, script, image etc
const orderKey = cli.flags.order

const ua = device === 'pc' ? UA_CHROME : UA_CHROME_MOBILE
const vp = device === 'pc' ? VIEWPORT_PC_DEFAULT : VIEWPORT_SP_DEFAULT

const convertMs = (s) => Math.floor((s) * 1000000) / 1000
const getFilenameFromUrl = (ur) => ur.match( /[^/]+$/i )[0]
console.log(cli)
;(async () => {
  try {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setViewport(vp)
    await page.setUserAgent(ua)
    let requestList = {}
    page.on('request', async (req) => {
      const resource = req.resourceType()
      const checkResource = reso.split(',').some((r) => r === resource)
      if (req.method() === 'GET' && checkResource) {
        const url = req.url()
        const start = await page.metrics()
        requestList[url] = {
          resource,
          start: start.Timestamp
        }
      }
    });
    page.on('requestfinished', async (req) => {
      const end = await page.metrics()
      const url = req.url()
      if (requestList.hasOwnProperty(url)) {
        const info = requestList[url] = {
          ...requestList[url],
          end: end.Timestamp,
          time: convertMs(end.Timestamp - requestList[url].start),
          url
        }
        console.log(`${getFilenameFromUrl(info.url)}: ${info.resource} -> ${info.time}ms`)
      }
    })
    await page.goto(targetUrl)
    // page.removeListener('request', logger);
    await browser.close()
    const sortHeavyList = Object.values(requestList).sort((a,b) => a[orderKey] > b[orderKey] ? 1 : -1)
    console.table(sortHeavyList)
    process.exit()
  } catch (err) {
    console.log(err)
    process.exit()
  }
})()
