// Cliente Axios único — usado por todos os recursos (features).
// Não contém dados fictícios nem lógica de negócio.

import axios from 'axios'

export const http = axios.create({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})
