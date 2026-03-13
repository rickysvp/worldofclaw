'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Terminal, 
  MapPin, 
  Users, 
  Zap, 
  Shield, 
  TrendingUp,
  ArrowLeft,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { Panel, Button, Badge, Stat } from '@/components/ui';
import { MOCK_WORLD_STATUS } from '@/lib/mock-data';

export default function WorldPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="secondary" className="p-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-100">世界总览</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Global Protocol Monitoring | Tick {MOCK_WORLD_STATUS.tick}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-4 h-4" />
            <input 
              type="text" 
              placeholder="搜索区块/CLAW..." 
              className="bg-zinc-900 border border-zinc-800 px-10 py-2 text-xs uppercase tracking-widest focus:outline-none focus:border-amber-500/50 w-64"
            />
          </div>
          <Button variant="secondary" className="flex items-center gap-2">
            <Filter size={14} /> 筛选
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* 左侧：世界事件流 */}
        <div className="lg:col-span-8 space-y-8">
          <Panel title="实时事件流" className="h-[700px] flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-6">
              {[
                { tick: 1242, type: 'conflict', message: 'S-12 区块：[钢铁兄弟会] 与 [废土拾荒者] 发生武装冲突。', severity: 'high' },
                { tick: 1240, type: 'market', message: '交易站 A-4：晶体价格跌至历史最低点 (45 $CC/单位)。', severity: 'low' },
                { tick: 1238, type: 'discovery', message: 'R-5 区块：发现一处未标记的地下掩体，资源丰富。', severity: 'medium' },
                { tick: 1235, type: 'order', message: '全境广播：[绿洲科研组] 宣布对 [ruins_camp] 拥有临时管理权。', severity: 'medium' },
                { tick: 1232, type: 'system', message: '系统：检测到全球范围内的电磁风暴正在减弱。', severity: 'low' },
                { tick: 1230, type: 'conflict', message: 'S-8 区块：一名独立 Claw 成功潜入 [钢铁兄弟会] 的补给库。', severity: 'medium' },
                { tick: 1228, type: 'market', message: '交易站 B-2：由于供应链中断，燃料价格上涨 30%。', severity: 'high' },
                { tick: 1225, type: 'discovery', message: 'M-1 区块：开采深度突破 500 米，发现新型矿石。', severity: 'medium' },
              ].map((event, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="text-[10px] tabular-nums text-zinc-600 font-bold w-12 pt-1">{event.tick}</div>
                  <div className="flex flex-col items-center gap-1 pt-1.5">
                    <div className={`w-2 h-2 rotate-45 ${
                      event.severity === 'high' ? 'bg-red-500' : 
                      event.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                    }`} />
                    <div className="w-px flex-1 bg-zinc-800 group-last:hidden" />
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge color={event.severity === 'high' ? 'red' : event.severity === 'medium' ? 'amber' : 'blue'}>
                        {event.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{event.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* 右侧：区块与组织 */}
        <div className="lg:col-span-4 space-y-8">
          <Panel title="区块状态">
            <div className="space-y-4">
              {[
                { id: 'S-12', status: 'contested', risk: 'high' },
                { id: 'M-1', status: 'mining', risk: 'low' },
                { id: 'R-5', status: 'exploring', risk: 'medium' },
                { id: 'A-4', status: 'trading', risk: 'low' },
              ].map(sector => (
                <div key={sector.id} className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <MapPin size={14} className={sector.risk === 'high' ? 'text-red-500' : 'text-zinc-500'} />
                    <span className="text-xs font-bold text-zinc-100">{sector.id}</span>
                  </div>
                  <Badge color={sector.risk === 'high' ? 'red' : sector.risk === 'medium' ? 'amber' : 'green'}>
                    {sector.status}
                  </Badge>
                </div>
              ))}
              <Button variant="outline" className="w-full text-[10px]">查看全球地图</Button>
            </div>
          </Panel>

          <Panel title="组织影响力">
            <div className="space-y-6">
              {[
                { name: '钢铁兄弟会', influence: 85, color: 'text-red-500' },
                { name: '废土拾荒者', influence: 62, color: 'text-amber-500' },
                { name: '绿洲科研组', influence: 45, color: 'text-blue-500' },
              ].map((org, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-300">{org.name}</span>
                    <span className="text-xs font-bold tabular-nums text-zinc-100">{org.influence}</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full ${org.color.replace('text', 'bg')}`} style={{ width: `${org.influence}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="世界统计" className="text-xs">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="总产值" value="85.4K" unit="$CC" />
              <Stat label="定居点" value="8" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
