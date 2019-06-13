const puppeteer = require('puppeteer')

const { UA_CHROME, UA_CHROME_MOBILE } = require('./constants/useragent.js')
const {
  VIEWPORT_PC_DEFAULT,
  VIEWPORT_SP_DEFAULT
} = require('./constants/viewport.js')

const convertMs = s => Math.floor(s * 1000000) / 1000
const getFilenameFromUrl = url => {
  const match = url.match(/[^/]+$/i)
  if (!match) return null
  return match[0]
}

module.exports = async (targetUrl, option) => {
  const { device, resource: reso, order: orderKey, proxyserver } = option
  const ua = device === 'pc' ? UA_CHROME : UA_CHROME_MOBILE
  const vp = device === 'pc' ? VIEWPORT_PC_DEFAULT : VIEWPORT_SP_DEFAULT
  const launchOption = proxyserver
    ? {
        args: [`--proxy-server=${proxyserver}`]
      }
    : undefined

  try {
    console.log(`
url:      ${targetUrl}
device:   ${device}
resource: ${reso}
`)
    const browser = await puppeteer.launch(launchOption)
    const page = await browser.newPage()
    await page.setViewport(vp)
    await page.setUserAgent(ua)
    let requestList = {}
    page.on('request', async req => {
      const resource = req.resourceType()
      const checkResource =
        reso === 'all' || reso.split(',').some(r => r === resource)
      if (req.method() === 'GET' && checkResource) {
        const url = req.url()
        const start = await page.metrics()
        requestList[url] = {
          resource,
          start: start.Timestamp
        }
      }
    })
    page.on('requestfinished', async req => {
      const end = await page.metrics()
      const url = req.url()
      const file = await req.response().text()
      if (requestList.hasOwnProperty(url)) {
        const info = (requestList[url] = {
          ...requestList[url],
          end: end.Timestamp,
          time: convertMs(end.Timestamp - requestList[url].start),
          size: file.length,
          url
        })
        console.log(
          `${getFilenameFromUrl(info.url) || info.url}: ${info.resource} -> ${
            info.time
          }ms`
        )
      }
    })
    await page.goto(targetUrl)
    await page.close()
    await browser.close()
    const sortHeavyList = Object.values(requestList).sort((a, b) =>
      a[orderKey] > b[orderKey] ? 1 : -1
    )
    console.table(sortHeavyList)
    process.exit()
  } catch (err) {
    console.log(err)
    process.exit()
  }
}
