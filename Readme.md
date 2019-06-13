# Research Network

> research network is cli tool for research network resource. This use [puppeteer](https://github.com/GoogleChrome/puppeteer) API.

## Install

```sh
npm i -g research-network
```

## Usage

```sh
$research-network -h

Usage
  $ research-network <url>

Options
  --help,-h             Show help.
  --device, -d          Select device. pc, sp.
  --resource, -r        Select research resource. all, xhf, fetch, script, image etc
  --order, -o           Sort by orderKey.  default resource download time. time, end, start, etc
  --proxyserver, -p     proxy server config.

Examples
  $ research-network https://google.com

```

## Refference 

https://pptr.dev/