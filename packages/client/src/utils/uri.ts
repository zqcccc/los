import { environment } from '../environments/environment'

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
)
console.log(
  '%c environment.production: ',
  'font-size:12px;background-color: #7F2B82;color:#fff;',
  environment.production
)
export const host = environment.production
  ? window.location.host
  : `${isLocalhost ? 'localhost' : window.location.hostname}:3333` // hostname has no port
export const baseUri = `${window.location.protocol}//${host}`
export const websocketUrl = `${
  window.location.protocol === 'https:' ? 'wss' : 'ws'
}://${host}/websockets`
