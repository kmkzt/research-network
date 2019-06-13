const puppeteer = require('puppeteer')

const { UA_CHROME, UA_CHROME_MOBILE } = require('./constants/useragent.js')
const {
  VIEWPORT_PC_DEFAULT,
  VIEWPORT_SP_DEFAULT
} = require('./constants/viewport.js')

const convertMs = (s) => Math.floor((s) * 1000000) / 1000
const getFilenameFromUrl = (url) => url.match( /[^/]+$/i )[0]

module.exports = async (targetUrl, { device, resource: reso, order: orderKey}) => {
  const ua = device === 'pc' ? UA_CHROME : UA_CHROME_MOBILE
  const vp = device === 'pc' ? VIEWPORT_PC_DEFAULT : VIEWPORT_SP_DEFAULT
  try {
    console.log(reso)
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
}
