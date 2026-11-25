import { useSyncExternalStore } from 'react'
import type { RealtimeStatus } from './manager'
import { realtime } from './setup'

export function useRealtimeStatus(): RealtimeStatus {
  return useSyncExternalStore(realtime.subscribe, realtime.getStatus, realtime.getStatus)
}
