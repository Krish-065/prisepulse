import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

export const useRealtime = (symbol, onPriceUpdate) => {
  const socketRef = useRef(null);
  const subscribedSymbolsRef = useRef(new Set());

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      // Re-subscribe to symbols after reconnect
      subscribedSymbolsRef.current.forEach(sym => {
        socketRef.current.emit('subscribe', { symbol: sym });
      });
    });

    socketRef.current.on('price-update', (data) => {
      if (onPriceUpdate) {
        onPriceUpdate(data);
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [onPriceUpdate]);

  const subscribe = useCallback((sym) => {
    if (socketRef.current && !subscribedSymbolsRef.current.has(sym)) {
      socketRef.current.emit('subscribe', { symbol: sym });
      subscribedSymbolsRef.current.add(sym);
    }
  }, []);

  const unsubscribe = useCallback((sym) => {
    if (socketRef.current) {
      socketRef.current.emit('unsubscribe', { symbol: sym });
      subscribedSymbolsRef.current.delete(sym);
    }
  }, []);

  const subscribeToMultiple = useCallback((symbols) => {
    symbols.forEach(sym => subscribe(sym));
  }, [subscribe]);

  return { subscribe, unsubscribe, subscribeToMultiple, socket: socketRef.current };
};

export default useRealtime;
