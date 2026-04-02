import { useEffect, useRef, useCallback } from 'react';

/**
 * SSE (Server-Sent Events) hook
 * Статус өзгерген кезде серверден нақты уақыт хабарламаларын алады.
 *
 * @param {function} onMessage - хабарлама келгенде шақырылатын callback ({ type, applicationId, status, ... })
 * @param {boolean}  enabled   - SSE байланысы ашық болу керек пе
 */
const useSSE = (onMessage, enabled = true) => {
  const esRef      = useRef(null);
  const onMsgRef   = useRef(onMessage);

  // callback-ты ref-ке сақтаймыз — қайта қосылу болмасын
  useEffect(() => { onMsgRef.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !enabled) return;

    const BASE = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : '/api';

    // EventSource тікелей URL арқылы ашамыз, токенді query param-мен береміз
    // (EventSource Authorization header қолдамайды)
    const url = `${BASE}/applications/events?token=${encodeURIComponent(token)}`;
    const es  = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onMsgRef.current?.(payload);
      } catch { /* JSON parse қатесі */ }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // 5 секундтан кейін қайта қосылу
      setTimeout(connect, 5000);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect, enabled]);
};

export default useSSE;
