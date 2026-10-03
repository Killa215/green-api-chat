import { useState, useEffect, useCallback, useRef } from "react";
import LoginForm from "./components/LoginForm";
import ChatList from "./components/ChatList";
import ChatWindow from "./components/ChatWindow";
import {
  receiveNotification,
  deleteNotification,
  getChatHistory,
  getChats,
} from "./api/greenApi";
import {
  loadChats,
  saveChats,
  loadMessages,
  saveMessages,
  loadActiveChat,
  saveActiveChat,
} from "./storage";
import "./styles.css";

export default function App() {
  const [credentials, setCredentials] = useState(null);
  const [chats, setChats] = useState(() => loadChats());
  const [activeChat, setActiveChat] = useState(() => loadActiveChat());
  const [messagesByChat, setMessagesByChat] = useState(() => loadMessages());
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  const credsRef = useRef(credentials);
  const chatsRef = useRef(chats);
  const loadedChatsRef = useRef(new Set());
  const temporaryChatsRef = useRef(new Set());

  useEffect(() => { credsRef.current = credentials; }, [credentials]);
  useEffect(() => { chatsRef.current = chats; }, [chats]);

  useEffect(() => { saveChats(chats); }, [chats]);
  useEffect(() => { saveMessages(messagesByChat); }, [messagesByChat]);
  useEffect(() => { saveActiveChat(activeChat); }, [activeChat]);

  const addMessage = useCallback((chatId, message) => {
    setMessagesByChat((prev) => {
      const list = prev[chatId] || [];
      if (message.idMessage && list.some((m) => m.idMessage === message.idMessage)) {
        return prev;
      }
      return { ...prev, [chatId]: [...list, message] };
    });
    setChats((prev) => (prev.includes(chatId) ? prev : [...prev, chatId]));
  }, []);

  const deleteChatInternal = useCallback((chatId) => {
    setChats((prev) => prev.filter((c) => c !== chatId));
    setMessagesByChat((prev) => {
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
    loadedChatsRef.current.delete(chatId);
    temporaryChatsRef.current.delete(chatId);
  }, []);

  const loadChatsList = useCallback(async (creds) => {
    if (!creds) return [];
    setLoadingChats(true);
    try {
      const list = await getChats(creds);
      if (Array.isArray(list) && list.length > 0) {
        setChats((prev) => {
          const ids = new Set(prev);
          list.forEach((c) => {
            if (c.id) ids.add(c.id);
          });
          return Array.from(ids);
        });
        return list;
      }
      return [];
    } catch (e) {
      console.error("Не удалось загрузить список чатов:", e);
      return [];
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const loadHistory = useCallback(async (chatId, creds, force = false) => {
    if (!creds || !chatId) return;
    if (!force && loadedChatsRef.current.has(chatId)) return;

    loadedChatsRef.current.add(chatId);
    setLoadingHistory(true);

    try {
      const history = await getChatHistory({ ...creds, chatId, count: 100 });

      const normalized = (history || [])
        .slice()
        .reverse()
        .map((item) => {
          const text =
            item.textMessage ||
            item.extendedTextMessage?.text ||
            (item.typeMessage !== "textMessage" ? "[не текстовое сообщение]" : "");
          const type = item.type === "outgoing" ? "outgoing" : "incoming";
          return {
            idMessage: item.idMessage,
            text,
            type,
            timestamp: item.timestamp,
          };
        })
        .filter((m) => m.text);

      setMessagesByChat((prev) => {
        const existing = prev[chatId] || [];
        const ids = new Set(existing.map((m) => m.idMessage));
        const merged = [...existing];
        normalized.forEach((m) => {
          if (!ids.has(m.idMessage)) merged.push(m);
        });
        merged.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        return { ...prev, [chatId]: merged };
      });
    } catch (e) {
      console.error("Не удалось загрузить историю:", e);
      loadedChatsRef.current.delete(chatId);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeChat && credentials) {
      loadHistory(activeChat, credentials);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChat]);

  const handleLogin = async (creds) => {
    setCredentials(creds);
    credsRef.current = creds;
    await loadChatsList(creds);
    if (activeChat) await loadHistory(activeChat, creds, true);
  };

  useEffect(() => {
    if (!credentials) return;
    let stopped = false;
    let errorDelay = 5000;

    const poll = async () => {
      while (!stopped) {
        try {
          const notification = await receiveNotification(credsRef.current);

          if (notification && notification.body) {
            const { receiptId, body } = notification;

            try {
              await deleteNotification({ ...credsRef.current, receiptId });
            } catch (e) {
              console.warn("Не удалось удалить уведомление:", e);
            }

            const typeWebhook = body.typeWebhook;
            const msgData = body.messageData;

            if (
              typeWebhook === "incomingMessageReceived" ||
              typeWebhook === "outgoingMessageReceived" ||
              typeWebhook === "outgoingAPIMessageReceived"
            ) {
              let msgText = null;
              if (msgData?.typeMessage === "textMessage") {
                msgText = msgData?.textMessageData?.textMessage;
              } else if (msgData?.typeMessage === "extendedTextMessage") {
                msgText = msgData?.extendedTextMessageData?.text;
              }

              const sender = body.senderData?.chatId;
              const idMessage = body.idMessage;
              const timestamp = body.timestamp;
              const isOutgoing =
                typeWebhook === "outgoingMessageReceived" ||
                typeWebhook === "outgoingAPIMessageReceived";

              if (msgText && sender) {
                if (!isOutgoing) {
                  const tempChats = Array.from(temporaryChatsRef.current);

                  tempChats.forEach((tempChatId) => {
                    if (tempChatId === sender) return;

                    setActiveChat((prevActive) =>
                      prevActive === tempChatId ? sender : prevActive
                    );

                    deleteChatInternal(tempChatId);
                  });
                }

                addMessage(sender, {
                  idMessage,
                  text: msgText,
                  type: isOutgoing ? "outgoing" : "incoming",
                  timestamp,
                });

                if (!isOutgoing) {
                  setActiveChat(sender);
                }
              }
            }

            errorDelay = 5000;
          }
        } catch (e) {
          console.error("poll error:", e);
          errorDelay = Math.min(errorDelay * 1.5, 30000);
        }

        await new Promise((r) => setTimeout(r, errorDelay));
      }
    };

    poll();
    return () => { stopped = true; };
  }, [credentials, addMessage, deleteChatInternal]);

  const handleCreateChat = (input) => {
    const phoneNumber = input.trim().replace(/\D/g, "");
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Введите номер в формате 79991234567");
      return;
    }

    const chatId = `${phoneNumber}@c.us`;
    temporaryChatsRef.current.add(chatId);

    setChats((prev) => (prev.includes(chatId) ? prev : [...prev, chatId]));
    setActiveChat(chatId);
    setTimeout(() => loadHistory(chatId, credsRef.current), 500);
  };

  const handleDeleteChat = useCallback((chatId) => {
    deleteChatInternal(chatId);
    setActiveChat((prev) => (prev === chatId ? null : prev));
  }, [deleteChatInternal]);

  const handleSent = (chatId, text) => {
    addMessage(chatId, {
      idMessage: `local-${Date.now()}`,
      text,
      type: "outgoing",
      timestamp: Math.floor(Date.now() / 1000),
    });
  };

  if (!credentials) return <LoginForm onLogin={handleLogin} />;

  return (
    <div className="app">
      <ChatList
        chats={chats}
        activeChat={activeChat}
        loading={loadingChats}
        onSelect={setActiveChat}
        onCreateChat={handleCreateChat}
        onDeleteChat={handleDeleteChat}
      />
      <ChatWindow
        credentials={credentials}
        chatId={activeChat}
        messages={messagesByChat[activeChat] || []}
        loading={loadingHistory}
        onSent={handleSent}
      />
    </div>
  );
}