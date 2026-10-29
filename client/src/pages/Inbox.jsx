import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { Button, Alert, Card } from "../components/ui.jsx";

// Finder messages for one sticker. Owner can mark each as read.
export default function Inbox() {
  const { id } = useParams();
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { messages } = await api.get(`/stickers/${id}/messages`);
      setMessages(messages);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function markRead(mid) {
    await api.patch(`/messages/${mid}/read`);
    load();
  }

  if (error) return <Wrap><Alert kind="error">{error}</Alert></Wrap>;
  if (!messages) return <Wrap><p className="text-gray-500">Loading…</p></Wrap>;

  return (
    <Wrap>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Button as="link" to="/dashboard" variant="outline">
          Back
        </Button>
      </div>

      {messages.length === 0 ? (
        <Card className="text-center text-gray-600">
          No messages yet. When a finder contacts you, it’ll show up here.
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m._id} className={m.read ? "opacity-70" : ""}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  {m.foundWhere && (
                    <p className="text-sm text-gray-500">Found: {m.foundWhere}</p>
                  )}
                  <p className="mt-1 text-gray-800">{m.body}</p>
                  {m.finderContact && (
                    <p className="mt-2 text-sm">
                      <span className="text-gray-500">Finder contact: </span>
                      <span className="font-medium">{m.finderContact}</span>
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
                {!m.read && (
                  <Button variant="secondary" onClick={() => markRead(m._id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Wrap>
  );
}

function Wrap({ children }) {
  return <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>;
}
