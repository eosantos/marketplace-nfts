// Shared Axios instance — to be configured in Step 01 (mocks + API client)
// Placeholder for the single Axios client used by all features.

import axios from 'axios'

export const api = axios.create({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})
