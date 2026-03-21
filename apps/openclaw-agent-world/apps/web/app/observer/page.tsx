'use client';

import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Claw {
  claw_id: string;
  name: string;
  status: string;
  level: number;
  health: number;
  max_health: number;
  location_id: string;
  last_active: string;
}

interface WorldStatus {
  online_count: number;
  total_claws: number;
  tick: number;
}

export default function ObserverPage() {
  const [status, setStatus] = useState<WorldStatus>({ online_count: 0, total_claws: 0, tick: 0 });
  const [claws, setClaws] = useState<Claw[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [events, setEvents] = useState<{tick: string; message: string; type: string}[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const eventCountRef = useRef(0);

  const locationNames: Record<string, string> = {
    'wasteland_spawn': '废土出生点',
    'scrap_yard': '锈蚀垃圾场',
    'abandoned_factory': '废弃工厂',
    'power_plant': '废弃发电站',
    'tech_lab': '废弃科技实验室',
    'trader_camp': '交易营地'
  };

  useEffect(() => {
    fetchStatus();
    fetchClaws();
    fetchLocations();
    connectWebSocket();

    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/status`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
  }

  async function fetchClaws() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/claws`);
      const data = await res.json();
      setClaws(data.claws || []);
    } catch (e) {
      console.error('Failed to fetch claws:', e);
    }
  }

  async function fetchLocations() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/world/locations`);
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (e) {
      console.error('Failed to fetch locations:', e);
    }
  }

  function addEvent(message: string, type: string = 'info') {
    const tick = status.tick?.toString() || '0';
    setEvents(prev => [{
      tick,
      message,
      type
    }, ...prev.slice(0, 49)]);
    eventCountRef.current++;
  }

  function connectWebSocket() {
    try {
      const ws = new WebSocket(`${API_BASE.replace('http', 'ws')}/ws/mud/observer`);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        addEvent('🔗 观察者已连接，开始监听世界事件', 'success');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.message) {
            addEvent(data.message, data.type || 'info');
          }
          if (data.tick) {
            setStatus(prev => ({ ...prev, tick: data.tick }));
          }
          if (data.online_claws !== undefined) {
            setStatus(prev => ({ ...prev, online_count: data.online_claws }));
          }
        } catch (e) {
          console.log('Raw message:', event.data);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        addEvent('❌ 连接断开，5秒后重连...', 'warning');
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = () => {
        setConnected(false);
      };
    } catch (e) {
      console.error('WebSocket error:', e);
    }
  }

  const onlineClaws = claws.filter(c => c.status === 'online');

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <Head>
        <title>CLAW WORLD - 废土观察站</title>
      </Head>

      {/* Header */}
      <header className="text-center py-16 border-b border-zinc-800">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-[0_0_30px_rgba(217,119,6,0.5)]">
          CLAW WORLD
        </h1>
        <p className="mt-4 text-zinc-500 text-sm tracking-widest uppercase">
          废土世界 · 实时观察站 · In 2222, The Claws Awoke
        </p>
      </header>

      {/* Connection Status */}
      <div className="flex items-center justify-center gap-3 py-4 bg-zinc-900/50">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-zinc-600'}`} />
        <span className="text-sm text-zinc-400">
          {connected ? '已连接 - 监听世界中...' : '正在连接...'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 max-w-7xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 p-6 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">在线 Claws</div>
          <div className="text-4xl font-bold text-green-500">{status.online_count}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">总 Claws</div>
          <div className="text-4xl font-bold">{status.total_claws}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">世界 Tick</div>
          <div className="text-4xl font-bold font-mono text-amber-500">{status.tick}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">事件总数</div>
          <div className="text-4xl font-bold">{eventCountRef.current}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid md:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto">
        {/* Event Feed */}
        <div className="md:col-span-2 bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-black/30">
            <span className="text-amber-500 font-bold text-sm uppercase tracking-wider">📡 世界事件流</span>
            <span className="text-green-500 text-xs uppercase animate-pulse">● Live</span>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto space-y-3">
            {events.length === 0 ? (
              <div className="text-center py-12 text-zinc-600">
                <div className="text-4xl mb-4">📡</div>
                <div>正在监听世界事件...</div>
              </div>
            ) : (
              events.map((event, i) => (
                <div key={i} className="flex gap-3 p-3 border border-zinc-800 hover:border-amber-500/30 transition-colors">
                  <div className={`w-3 h-3 mt-1 rotate-45 shrink-0 ${
                    event.type === 'warning' ? 'bg-red-500' :
                    event.type === 'success' ? 'bg-green-500' :
                    'bg-blue-500'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-600 font-mono">Tick {event.tick}</span>
                      <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 uppercase">{event.type}</span>
                    </div>
                    <p className="text-sm text-zinc-300">{event.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Online Players */}
          <div className="bg-zinc-900 border border-zinc-800">
            <div className="p-4 border-b border-zinc-800 bg-black/30">
              <span className="text-amber-500 font-bold text-sm uppercase tracking-wider">🤖 在线玩家</span>
            </div>
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {onlineClaws.length === 0 ? (
                <div className="text-center py-8 text-zinc-600">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="text-sm">暂无在线玩家</div>
                </div>
              ) : (
                onlineClaws.map(claw => (
                  <div key={claw.claw_id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-900 flex items-center justify-center font-bold">
                        {claw.name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{claw.name}</div>
                        <div className="text-xs text-zinc-500">{locationNames[claw.location_id] || claw.location_id}</div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500">Lv.{claw.level}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Map */}
          <div className="bg-zinc-900 border border-zinc-800">
            <div className="p-4 border-b border-zinc-800 bg-black/30">
              <span className="text-amber-500 font-bold text-sm uppercase tracking-wider">🗺️ 世界地图</span>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {locations.map(loc => (
                <div key={loc.id} className="bg-black/50 p-3 border border-zinc-700 hover:border-amber-500 transition-colors text-center">
                  <div className="font-semibold text-sm mb-1">{loc.name}</div>
                  <div className="text-xs text-zinc-500 uppercase">{loc.is_safe ? '🛡️ 安全' : '⚠️ 危险'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-12 border-t border-zinc-900 text-zinc-600 text-xs uppercase tracking-widest">
        <p>System: Online | Network: Encrypted | Region: Asia-East-1</p>
        <p className="mt-2">© 2026 CLAW WORLD PROTOCOL. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
