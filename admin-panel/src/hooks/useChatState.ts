import { useState, useRef, useEffect } from 'react';

interface TypingUsers {
  [conversationId: string]: string[];
}

export var useChatState = (userId?: string) => {
  var [typingUsers, setTypingUsers] = useState<TypingUsers>({});
  var [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  var typingTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  var handleUserTyping = (data: { conversationId: string; userId: string; username?: string; isTyping: boolean }) => 
    new Promise<void>((resolve) => {
      var { conversationId, userId: typingUserId, isTyping } = data;
      
      typingUserId === userId ? resolve() : (() => {
        isTyping ? (() => {
          setTypingUsers(prev => {
            var currentTyping = prev[conversationId] || [];
            return !currentTyping.includes(typingUserId) ? (() => {
              var key = `${conversationId}-${typingUserId}`;
              typingTimersRef.current[key] ? clearTimeout(typingTimersRef.current[key]) : null;
              
              typingTimersRef.current[key] = setTimeout(() => {
                setTypingUsers(prevState => ({
                  ...prevState,
                  [conversationId]: prevState[conversationId]?.filter(id => id !== typingUserId) || []
                }));
                delete typingTimersRef.current[key];
              }, 3000);
              
              return { ...prev, [conversationId]: [...currentTyping, typingUserId] };
            })() : (() => {
              var key = `${conversationId}-${typingUserId}`;
              typingTimersRef.current[key] ? clearTimeout(typingTimersRef.current[key]) : null;
              
              typingTimersRef.current[key] = setTimeout(() => {
                setTypingUsers(prevState => ({
                  ...prevState,
                  [conversationId]: prevState[conversationId]?.filter(id => id !== typingUserId) || []
                }));
                delete typingTimersRef.current[key];
              }, 3000);
              
              return prev;
            })();
          });
        })() : (() => {
          var key = `${conversationId}-${typingUserId}`;
          typingTimersRef.current[key] ? (() => {
            clearTimeout(typingTimersRef.current[key]);
            delete typingTimersRef.current[key];
          })() : null;
          
          setTypingUsers(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter(id => id !== typingUserId)
          }));
        })();
        
        resolve();
      })();
    });

  var handleUserOnline = (data: { userId: string; isOnline: boolean }) => 
    new Promise<void>((resolve) => {
      var { userId: onlineUserId, isOnline } = data;
      
      setOnlineUsers(prev => {
        var newSet = new Set(prev);
        isOnline ? newSet.add(onlineUserId) : newSet.delete(onlineUserId);
        return newSet;
      });
      
      resolve();
    });

  var clearTypingTimer = (conversationId: string, userId: string) => 
    new Promise<void>((resolve) => {
      var key = `${conversationId}-${userId}`;
      typingTimersRef.current[key] ? (() => {
        clearTimeout(typingTimersRef.current[key]);
        delete typingTimersRef.current[key];
      })() : null;
      resolve();
    });

  var setTypingTimer = (conversationId: string, userId: string) => 
    new Promise<void>((resolve) => {
      var key = `${conversationId}-${userId}`;
      
      typingTimersRef.current[key] ? (() => {
        clearTimeout(typingTimersRef.current[key]);
        delete typingTimersRef.current[key];
      })() : null;
      
      typingTimersRef.current[key] = setTimeout(() => {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: prev[conversationId]?.filter(id => id !== userId) || []
        }));
        delete typingTimersRef.current[key];
      }, 3000);
      
      resolve();
    });

  useEffect(() => () => {
    Object.values(typingTimersRef.current).forEach(timer => clearTimeout(timer));
    typingTimersRef.current = {};
  }, []);

  return {
    typingUsers,
    onlineUsers,
    handleUserTyping,
    handleUserOnline,
    clearTypingTimer,
    setTypingTimer
  };
};