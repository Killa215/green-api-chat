import { useState } from "react";

export default function LoginForm({ onLogin }) {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idInstance || !apiTokenInstance) return;
    onLogin({ idInstance, apiTokenInstance });
  };

  return (
    <div className="login-container">
      <h1>Вход в GREEN-API</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="idInstance"
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
        />
        <input
          type="text"
          placeholder="apiTokenInstance"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
        />
        <button type="submit">Войти</button>
      </form>
    </div>
  );
}