import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { REALTIME_PATH } from '@/shared/contracts'
import { onMockDbEvent } from '../events'
import { realtimeHub, type HubClient } from './hub'

// O cliente usa `path: REALTIME_PATH` (/realtime/) e este padrão casa só ele (qualquer host/protocolo).
// Um `ws.link('*')` pegaria também o WebSocket do HMR do Vite e quebraria o dev server.

// O binding simula o aperto de mão do Engine.IO, mas NÃO envia pings: sem eles o socket.io-client
// derruba a conexão ao fim de pingInterval + pingTimeout (30 s). O ping `2` do protocolo v4 sai daqui.
const PING_INTERVAL_MS = 20_000

const realtimeLink = ws.link(`*${REALTIME_PATH.replace(/\/$/, '')}`)

export const socketHandlers = [
  realtimeLink.addEventListener('connection', (connection) => {
    // O binding não decodifica o `auth` do pacote CONNECT: a autenticação é o evento `authenticate`.
    const { client } = toSocketIo(connection)

    const hubClient: HubClient = {
      send: (event, payload) => {
        client.emit(event, payload)
      },
      close: () => {
        connection.client.close(1000, 'Conexão derrubada pelo servidor simulado')
      },
    }

    realtimeHub.connect(hubClient)

    const ping = setInterval(() => {
      connection.client.send('2')
    }, PING_INTERVAL_MS)

    client.on('authenticate', (_event, payload: unknown) => {
      realtimeHub.authenticate(hubClient, payload)
    })

    connection.client.addEventListener('close', () => {
      clearInterval(ping)
      realtimeHub.disconnect(hubClient)
    })
  }),
]

let installed = false

/** Liga o barramento de eventos do banco aos sockets (uma vez, no bootstrap dos mocks). */
export function installRealtimeHub(): void {
  if (installed) return
  installed = true
  onMockDbEvent((event) => {
    realtimeHub.handleDbEvent(event)
  })
}
