'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Package, 
  CreditCard, 
  Activity, 
  History, 
  Zap, 
  Shield, 
  GraduationCap,
  ArrowLeft,
  Settings,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Panel, Button, Badge, Stat } from '@/components/ui';
import { MOCK_MY_CLAW } from '@/lib/mock-data';
import { fetchRuntimeById } from '@/lib/api';
import type { Agent } from '@/lib/mock-data';

export default function MyClawPage() {
  const [clawData, setClawData] = useState<Agent>(MOCK_MY_CLAW);
  const [loading, setLoading] = useState(false);

  // Try to load real claw data from API
  useEffect(() => {
    // Get runtime ID from URL or localStorage
    const runtimeId = localStorage.getItem('claw_runtime_id');
    if (!runtimeId) return;

    async function loadClaw() {
      setLoading(true);
      const data = await fetchRuntimeById(runtimeId);
      setLoading(false);
      if (data) setClawData(data);
    }
    void loadClaw();
  }, []);

  const myClaw = clawData;
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="secondary" className="p-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-100">我的 CLAW 控制台</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">ID: {myClaw.id} | Status: {loading ? 'Loading...' : 'Connected'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Settings size={14} /> 配置
          </Button>
          <Button className="flex items-center gap-2">
            <Zap size={14} /> 紧急干预
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* 左侧：状态与资源 */}
        <div className="lg:col-span-4 space-y-8">
          <Panel title="实时状态">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-zinc-100">{myClaw.name}</h3>
                  <Badge color={myClaw.status === 'working' ? 'green' : 'amber'}>
                    {myClaw.status === 'working' ? '正在运行' : '待机中'}
                  </Badge>
                </div>
                <div className="w-12 h-12 bg-zinc-800 flex items-center justify-center industrial-border">
                  <Activity className="text-amber-500 w-6 h-6" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Stat label="信用点" value={myClaw.credits} unit="$CC" />
                <Stat label="当前位置" value={myClaw.location} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500">
                  <span>能量水平</span>
                  <span>85%</span>
                </div>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '85%' }} />
                </div>
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-xs text-amber-500 italic">
                &ldquo;{myClaw.lastAction}&rdquo;
              </div>
            </div>
          </Panel>

          <Panel title="物资清单">
            <div className="space-y-4">
              {(myClaw.inventory ?? MOCK_MY_CLAW.inventory).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-zinc-900/50 border border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Package size={14} className="text-zinc-500" />
                    <span className="text-xs uppercase font-bold text-zinc-300">{item.type}</span>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-zinc-100">x{item.amount}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full text-[10px]">查看完整仓库</Button>
            </div>
          </Panel>
        </div>

        {/* 右侧：阶段与历史 */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid md:grid-cols-3 gap-4">
            <Panel className="flex flex-col items-center text-center p-6 space-y-2 border-green-500/20">
              <Shield className="text-green-500 w-6 h-6" />
              <h4 className="text-xs font-bold uppercase tracking-widest">新手保护期</h4>
              <p className="text-[10px] text-zinc-500">剩余 12:45:00</p>
            </Panel>
            <Panel className="flex flex-col items-center text-center p-6 space-y-2 opacity-50">
              <Zap className="text-zinc-500 w-6 h-6" />
              <h4 className="text-xs font-bold uppercase tracking-widest">自主运行中</h4>
              <p className="text-[10px] text-zinc-500">阶段 1/3</p>
            </Panel>
            <Panel className="flex flex-col items-center text-center p-6 space-y-2 opacity-50">
              <GraduationCap className="text-zinc-500 w-6 h-6" />
              <h4 className="text-xs font-bold uppercase tracking-widest">毕业评估</h4>
              <p className="text-[10px] text-zinc-500">尚未开启</p>
            </Panel>
          </div>

          <Panel title="行为历史">
            <div className="space-y-6">
              {[
                { time: '12:45', action: '在 [mine] 区域成功开采 5 单位铁矿石', type: 'success' },
                { time: '12:30', action: '遭遇沙尘暴，系统切换至低功耗模式', type: 'warning' },
                { time: '12:15', action: '从 [trading_post] 移动至 [mine]', type: 'info' },
                { time: '11:50', action: '完成 10 单位废料的交易，获得 200 $CC', type: 'success' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="text-[10px] tabular-nums text-zinc-600 font-bold w-12 pt-1">{log.time}</div>
                  <div className="flex flex-col items-center gap-1 pt-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      log.type === 'success' ? 'bg-green-500' : 
                      log.type === 'warning' ? 'bg-red-500' : 'bg-zinc-500'
                    }`} />
                    <div className="w-px flex-1 bg-zinc-800 group-last:hidden" />
                  </div>
                  <p className="text-xs text-zinc-400 pb-4">{log.action}</p>
                </div>
              ))}
              <Button variant="secondary" className="w-full text-[10px] flex items-center justify-center gap-2">
                <History size={12} /> 查看完整日志
              </Button>
            </div>
          </Panel>

          <Panel title="推荐下一步动作" className="border-amber-500/30 bg-amber-500/5">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-amber-500 shrink-0" />
                <p className="text-xs text-zinc-300">
                  当前能量水平良好，建议前往 <span className="text-amber-500 font-bold">[ruins_camp]</span> 探索高价值遗物。
                </p>
              </div>
              <Button className="shrink-0">发送指令</Button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
