import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hey! 👋", sent: false },
    { text: "Hey! What's up?", sent: true },
    { text: "Not much! This chat app looks cool.", sent: false },
  ]);

  function sendMessage() {
    if (message.trim() === "") return;

    setMessages([
      ...messages,
      {
        text: message,
        sent: true,
      },
    ]);

    setMessage("");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Friend Chat</h2>

        <div className="friend active">
          <div className="avatar">A</div>
          <div>
            <strong>Alex</strong>
            <p>Online</p>
          </div>
        </div>

        <div className="friend">
          <div className="avatar">J</div>
          <div>
            <strong>Jamie</strong>
            <p>Offline</p>
          </div>
        </div>

        <div className="friend">
          <div className="avatar">S</div>
          <div>
            <strong>Sam</strong>
            <p>Online</p>
          </div>
        </div>
      </aside>

      <main className="chat">
        <header className="chat-header">
          <div className="avatar">A</div>
          <div>
            <h3>Alex</h3>
            <p>Online</p>
          </div>
        </header>

        <section className="messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message ${msg.sent ? "sent" : "received"}`}
            >
              {msg.text}
            </div>
          ))}
        </section>

        <div className="message-box">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button onClick={sendMessage}>Send</button>
        </div>
      </main>
    </div>
  );
}

export default App;