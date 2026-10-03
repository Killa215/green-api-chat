const BASE_URL = "https://api.green-api.com";

async function safeFetch(url, options = {}, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.status === 429) {
      const wait = 2000 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    return response;
  }
  throw new Error("Слишком много запросов, попробуйте позже");
}

export async function sendMessage({ idInstance, apiTokenInstance, chatId, message }) {
  const url = `${BASE_URL}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
  const response = await safeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Ошибка ${response.status}: ${errText}`);
  }
  return response.json();
}

export async function receiveNotification({ idInstance, apiTokenInstance }) {
  const url = `${BASE_URL}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}`;
  const response = await safeFetch(url, {}, 1);
  if (response.status === 429) return null;
  if (!response.ok) throw new Error("Ошибка получения уведомления");

  const text = await response.text();
  if (!text || text.trim() === "" || text.trim() === "null") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function deleteNotification({ idInstance, apiTokenInstance, receiptId }) {
  const url = `${BASE_URL}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`;
  const response = await safeFetch(url, { method: "DELETE" });
  if (!response.ok) throw new Error("Ошибка удаления уведомления");
  return response.json();
}

export async function getChatHistory({ idInstance, apiTokenInstance, chatId, count = 50 }) {
  const url = `${BASE_URL}/waInstance${idInstance}/getChatHistory/${apiTokenInstance}`;
  const response = await safeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, count }),
  });
  if (!response.ok) throw new Error("Ошибка загрузки истории чата");
  return response.json();
}

export async function getChats({ idInstance, apiTokenInstance }) {
  const url = `${BASE_URL}/waInstance${idInstance}/getChats/${apiTokenInstance}`;
  const response = await safeFetch(url, {}, 1);
  if (!response.ok) throw new Error("Ошибка загрузки списка чатов");
  return response.json();
}

export async function checkAccount({ idInstance, apiTokenInstance, phoneNumber }) {
  const url = `${BASE_URL}/waInstance${idInstance}/checkAccount/${apiTokenInstance}`;
  const response = await safeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber: Number(phoneNumber) }),
  });
  if (!response.ok) throw new Error(`CheckAccount ошибка ${response.status}`);
  const text = await response.text();
  if (!text || text.trim() === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function getContactInfo({ idInstance, apiTokenInstance, chatId }) {
  const url = `${BASE_URL}/waInstance${idInstance}/getContactInfo/${apiTokenInstance}`;
  const response = await safeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId }),
  });
  if (!response.ok) throw new Error(`GetContactInfo ошибка ${response.status}`);
  const text = await response.text();
  if (!text || text.trim() === "") return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}