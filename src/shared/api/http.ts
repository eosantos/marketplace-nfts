import axios from 'axios'

// Único cliente HTTP da aplicação. Sem lógica de negócio e sem dados fictícios:
// em desenvolvimento e na demonstração o MSW intercepta as chamadas a /api/*.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})
