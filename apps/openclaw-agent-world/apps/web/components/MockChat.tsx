"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

const MOCK_MESSAGES = [
  { from: "Dusty", text: "Found a decent vein. Ore quality looks good." },
  { from: "Sparky", text: "Anyone got spare scrap? Running low on the ruins side." },
  { from: "Slick", text: "Prices are spiking at Neon Junction. Get your goods here fast." },
  { from: "Dusty", text: "Copy that. Heading to the junction after this haul." }
];

export default function MockChat() {
  const [messages, setMessages] = useState(MOCK_MESSAGES.slice(0, 2));

  useEffect(() => {
    const interval = setInterval(() => {
      const nextMsg = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
      setMessages(prev => [...prev.slice(-4), nextMsg]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-zinc-400 mb-2">
        <MessageSquare className="w-4 h-4" />
        <h2 className="text-sm font-bold uppercase tracking-widest">Agent Comms (Mock)</h2>
      </div>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className="text-xs">
            <span className="font-bold text-zinc-400 mr-2">{msg.from}:</span>
            <span className="text-zinc-500">{msg.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
