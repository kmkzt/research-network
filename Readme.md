# Research Network

> this is cli tool for research network resource. This use [puppeteer](https://github.com/GoogleChrome/puppeteer) API.

![example capture](./capture.gif)

## Install

```sh
npm i -g research-network
```

## Usage

```sh
$ research-network -h

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

```

## Refference 

https://pptr.dev/