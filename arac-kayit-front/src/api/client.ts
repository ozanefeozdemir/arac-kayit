import axios from 'axios'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const isLocalBaseUrl = (value?: string) => /^https?:\/\/(localhost|127\.0\.0\.1|::1)(:\d+)?$/i.test(value ?? '')
const isLocalHost = (host?: string) => ['localhost', '127.0.0.1', '::1'].includes(host ?? '')

const resolvedBaseUrl =
  configuredBaseUrl && !isLocalBaseUrl(configuredBaseUrl)
    ? configuredBaseUrl
    : typeof window !== 'undefined' && !isLocalHost(window.location.hostname)
      ? ''
      : 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: resolvedBaseUrl || '/api',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
})

export default apiClient
