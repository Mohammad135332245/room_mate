import { WS_URL } from '../config/constants'
import { getAccessToken } from '../../utils/storage'

/**
 * Thin wrapper around the chat WebSocket with automatic reconnection.
 *
 * The backend expects `/ws/chat/{applicationId}?token=<access token>` and
 * exchanges `{ type, payload }` frames.
 */
export function createChatSocket(applicationId, handlers = {}) {
  const { onMessage, onTyping, onRead, onPresence, onStatusChange, onError } =
    handlers

  let socket = null
  let closedByUs = false
  let attempt = 0
  let reconnectTimer = null

  function setStatus(status) {
    onStatusChange?.(status)
  }

  function connect() {
    const token = getAccessToken()
    if (!token) {
      setStatus('unauthorized')
      return
    }

    setStatus(attempt === 0 ? 'connecting' : 'reconnecting')
    socket = new WebSocket(
      `${WS_URL}/chat/${applicationId}?token=${encodeURIComponent(token)}`,
    )

    socket.onopen = () => {
      attempt = 0
      setStatus('open')
    }

    socket.onmessage = (event) => {
      let frame
      try {
        frame = JSON.parse(event.data)
      } catch {
        return
      }
      switch (frame.type) {
        case 'message':
          onMessage?.(frame.payload)
          break
        case 'typing':
          onTyping?.(frame.payload)
          break
        case 'read':
          onRead?.(frame.payload)
          break
        case 'presence':
          onPresence?.(frame.payload)
          break
        case 'error':
          onError?.(frame.detail ?? 'Chat error')
          break
        default:
          break
      }
    }

    socket.onclose = (event) => {
      if (closedByUs) return
      // 4401/4403 mean the server rejected us; retrying will not help.
      if (event.code === 4401 || event.code === 4403) {
        setStatus('unauthorized')
        onError?.(event.reason || 'You cannot join this conversation')
        return
      }
      setStatus('closed')
      const delay = Math.min(1000 * 2 ** attempt, 15000)
      attempt += 1
      reconnectTimer = setTimeout(connect, delay)
    }

    socket.onerror = () => setStatus('error')
  }

  function send(frame) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(frame))
      return true
    }
    return false
  }

  connect()

  return {
    sendMessage: (text) => send({ type: 'message', text }),
    sendTyping: () => send({ type: 'typing' }),
    sendRead: () => send({ type: 'read' }),
    isOpen: () => socket?.readyState === WebSocket.OPEN,
    close() {
      closedByUs = true
      clearTimeout(reconnectTimer)
      socket?.close()
    },
  }
}
