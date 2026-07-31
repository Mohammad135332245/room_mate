import { useCallback, useEffect, useRef, useState } from 'react'

import { chatApi } from '../../core/api/endpoints'
import { createChatSocket } from '../../core/websocket/chatSocket'
import { errorMessage } from '../../core/api/client'

const TYPING_TIMEOUT = 2500

/**
 * Loads chat history for an application and keeps it live over the socket.
 * Falls back to the REST endpoint when the socket is not connected.
 */
export function useChat(applicationId, currentUserId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(Boolean(applicationId))
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('idle')
  const [peerTyping, setPeerTyping] = useState(false)

  const socketRef = useRef(null)
  const typingTimer = useRef(null)
  const lastTypingSent = useRef(0)

  const appendMessage = useCallback((message) => {
    setMessages((current) =>
      current.some((item) => item.id === message.id)
        ? current
        : [...current, message],
    )
  }, [])

  useEffect(() => {
    if (!applicationId) {
      setMessages([])
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setPeerTyping(false)

    chatApi
      .history(applicationId, { limit: 50 })
      .then((history) => !cancelled && setMessages(history.items))
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false))

    const socket = createChatSocket(applicationId, {
      onMessage: (message) => {
        appendMessage(message)
        setPeerTyping(false)
        // Anything arriving while the thread is open is already read.
        if (message.sender_id !== currentUserId) socket.sendRead()
      },
      onTyping: ({ user_id }) => {
        if (user_id === currentUserId) return
        setPeerTyping(true)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setPeerTyping(false), TYPING_TIMEOUT)
      },
      onRead: ({ reader_id }) => {
        if (reader_id === currentUserId) return
        setMessages((current) =>
          current.map((message) =>
            message.sender_id === currentUserId
              ? { ...message, read: true }
              : message,
          ),
        )
      },
      onStatusChange: setStatus,
      onError: setError,
    })
    socketRef.current = socket

    return () => {
      cancelled = true
      clearTimeout(typingTimer.current)
      socket.close()
      socketRef.current = null
    }
  }, [applicationId, currentUserId, appendMessage])

  const send = useCallback(
    async (text) => {
      const trimmed = text.trim()
      if (!trimmed) return

      // The socket echoes the stored message back to everyone, this client
      // included, so there is nothing to append here.
      if (socketRef.current?.sendMessage(trimmed)) return

      try {
        const message = await chatApi.send(applicationId, trimmed)
        appendMessage(message)
      } catch (err) {
        setError(errorMessage(err, 'Message not sent'))
      }
    },
    [applicationId, appendMessage],
  )

  const notifyTyping = useCallback(() => {
    // One typing frame per second is plenty.
    const now = Date.now()
    if (now - lastTypingSent.current < 1000) return
    lastTypingSent.current = now
    socketRef.current?.sendTyping()
  }, [])

  return { messages, loading, error, status, peerTyping, send, notifyTyping }
}
