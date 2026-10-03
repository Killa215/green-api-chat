const CHATS_KEY = "greenapi_chats";
const MESSAGES_KEY = "greenapi_messages";
const ACTIVE_KEY = "greenapi_active";

export function loadChats() {
  try {
    return JSON.parse(localStorage.getItem(CHATS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveChats(chats) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export function loadMessages() {
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveMessages(messagesByChat) {
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(messagesByChat));
}

export function loadActiveChat() {
  return localStorage.getItem(ACTIVE_KEY) || null;
}

export function saveActiveChat(chatId) {
  if (chatId) localStorage.setItem(ACTIVE_KEY, chatId);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function clearStorage() {
  localStorage.removeItem(CHATS_KEY);
  localStorage.removeItem(MESSAGES_KEY);
  localStorage.removeItem(ACTIVE_KEY);
}