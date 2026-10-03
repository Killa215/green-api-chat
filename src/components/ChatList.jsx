import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ChatList({
  chats,
  activeChat,
  loading,
  onSelect,
  onCreateChat,
  onDeleteChat,
}) {
  const [newPhone, setNewPhone] = useState("");
  const [menu, setMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menu) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenu(null);
      }
    };
    const handleEsc = (e) => e.key === "Escape" && setMenu(null);
    const handleScroll = () => setMenu(null);

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menu]);

  const handleCreate = () => {
    const trimmed = newPhone.trim();
    if (!/^[\w.-]{5,32}$/.test(trimmed)) {
      alert("Введите номер в формате 79991234567 или ID чата из MAX");
      return;
    }
    onCreateChat(trimmed);
    setNewPhone("");
  };

  const toggleMenu = (chatId, e) => {
    e.stopPropagation();
    if (menu?.chatId === chatId) {
      setMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenu({
      chatId,
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
  };

  const handleDelete = (chatId, e) => {
    e.stopPropagation();
    setMenu(null);
    if (window.confirm(`Удалить чат ${chatId.replace(/@.*/, "")}?`)) {
      onDeleteChat(chatId);
    }
  };

  return (
    <aside className="chat-list">
      <div className="chat-list-title">Чаты</div>

      <div className="new-chat">
        <input
          type="text"
          placeholder="Номер получателя"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <button onClick={handleCreate}>+</button>
      </div>

      {loading && <div className="loading">Загрузка чатов…</div>}

      <ul>
        {chats.map((chat) => (
          <li
            key={chat}
            className={chat === activeChat ? "active" : ""}
            onClick={() => onSelect(chat)}
          >
            <span className="chat-name">{chat.replace(/@.*/, "")}</span>
            <button
              className="chat-menu-btn"
              onClick={(e) => toggleMenu(chat, e)}
              title="Действия"
              aria-label="Действия"
            >
              ⋮
            </button>
          </li>
        ))}

        {chats.length === 0 && !loading && (
          <li className="empty-chat">Нет чатов</li>
        )}
      </ul>

      {menu &&
        createPortal(
          <div
            ref={menuRef}
            className="chat-menu"
            style={{ top: menu.top, right: menu.right }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="chat-menu-item danger"
              onClick={(e) => handleDelete(menu.chatId, e)}
            >
              🗑 Удалить чат
            </button>
          </div>,
          document.body
        )}
    </aside>
  );
}