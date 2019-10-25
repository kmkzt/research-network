const puppeteer = require('puppeteer')
const ora = require('ora')
const chalk = require('chalk')
const { UA_CHROME, UA_CHROME_MOBILE } = require('./constants/useragent.js')
const {
  VIEWPORT_PC_DEFAULT,
  VIEWPORT_SP_DEFAULT
} = require('./constants/viewport.js')

const convertMs = s => Math.floor(s * 1000000) / 1000
const removeQueryAndHashUrl = url => {
  if (typeof url !== 'string') return url
  const match = url.match(/^(https?:\/{2,}.*?)(?:\?|#|$)/)
  if (!match || match.length > 2) return url
  return match[1]
}

module.exports = async (targetUrl, option) => {
  const {
    device,
    resource: reso,
    sort: sortKey,
    order,
    proxyserver,
    maxsize,
    maxtime
  } = option
  const ua = device === 'pc' ? UA_CHROME : UA_CHROME_MOBILE
  const vp = device === 'pc' ? VIEWPORT_PC_DEFAULT : VIEWPORT_SP_DEFAULT
  const compare = (a, b) => {
    if (a === b) return 0
    return a[sortKey] > b[sortKey] ? -1 : 1
  }
  const sort = (a, b) => (order === 'DESC' ? compare(a, b) : compare(b, a))
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
    await Promise.all([
      page.coverage.startJSCoverage(),
      page.coverage.startCSSCoverage()
    ])
    let requestList = {}
    const loading = ora('loading').start()
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
        loading.start(url)
      }
    })
    page.on('requestfailed', async req => {
      const url = req.url()
      if (requestList.hasOwnProperty(url)) {
        loading.fail(`fail: ${url}`)
      }
    })
    page.on('requestfinished', async req => {
      const res = req.response()
      if (!res.ok()) return
      const end = await page.metrics()
      const url = req.url()
      const file = await res.text()
      const size = file.length
      if (requestList.hasOwnProperty(url)) {
        const info = (requestList[url] = {
          ...requestList[url],
          end: end.Timestamp,
          time: convertMs(end.Timestamp - requestList[url].start),
          size,
          url
        })

        loading.succeed(
          `${info.resource}: ${
            info.size > (maxsize || 300000)
              ? chalk.bgRed(info.size + 'Byte')
              : chalk.green(info.size + 'Byte')
          } -> ${
            info.time > (maxtime || 500)
              ? chalk.bgRed(info.time + 'ms')
              : chalk.green(info.time + 'ms')
          } ${info.url}`
        )
      }
    })
    await page.goto(targetUrl)
    const [jsCoverage, cssCoverage] = await Promise.all([
      page.coverage.stopJSCoverage(),
      page.coverage.stopCSSCoverage()
    ])
    const coverage = [...cssCoverage, ...jsCoverage]
    for (const entry of coverage) {
      const url = entry.url
      if (!requestList.hasOwnProperty(url)) continue
      const fileByte = entry.text.length
      // totalBytes += entry.text.length
      const fileUsedByte = entry.ranges.reduce((used, range) => {
        return used + range.end - range.start - 1
      }, 0)
      requestList = {
        ...requestList,
        [url]: {
          ...requestList[url],
          coverage: Math.floor((fileUsedByte / fileByte) * 10000) / 100
        }
      }
    }
    const sortResult = Object.values(requestList)
      .sort(sort)
      .reduce((obj, d) => {
        if (!d.url) return obj
        let url = removeQueryAndHashUrl(d.url)
        if (obj.hasOwnProperty(url)) {
          url = chalk.bgRed(' duplicate? ') + url
        }
        const { resource, start, end, time, size, coverage } = d
        return {
          ...obj,
          [url]: {
            resource,
            size,
            coverage: coverage || '--',
            start,
            end,
            time
          }
        }
      }, {})

    console.log('\n')
    console.table(sortResult)
    process.exit()
  } catch (err) {
    console.log(err)
    process.exit()
  }
}
