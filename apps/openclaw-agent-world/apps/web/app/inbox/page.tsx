'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Inbox, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Clock,
  Zap,
  Shield,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Panel, Button, Badge } from '@/components/ui';
import { MOCK_INBOX } from '@/lib/mock-data';

export default function InboxPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <header className="flex items-center justify-between border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="secondary" className="p-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-100">Decision Inbox</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">待处理审批事项: {MOCK_INBOX.length}</p>
          </div>
        </div>
        <Badge color="amber">需要干预</Badge>
      </header>

      <div className="space-y-6">
        {MOCK_INBOX.map((decision) => (
          <Panel key={decision.id} className="p-0 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 flex items-center justify-center industrial-border">
                    <Zap className="text-amber-500 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">紧急决策请求</h3>
                    <p className="text-[10px] text-zinc-500 uppercase">来源: {decision.agentId} | 优先级: 高</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase">
                  <Clock size={12} /> 剩余时间: 04:59
                </div>
              </div>

              <div className="p-4 bg-zinc-900/80 border-l-2 border-amber-500 text-sm text-zinc-300 leading-relaxed italic">
                &ldquo;{decision.description}&rdquo;
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {decision.options.map((option) => (
                  <div key={option.id} className="group relative">
                    <button className="w-full text-left p-4 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-100 uppercase tracking-widest">{option.label}</span>
                        <ArrowLeft size={14} className="rotate-180 text-zinc-700 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <p className="text-[10px] text-zinc-500 group-hover:text-zinc-400 transition-colors">{option.effectDesc}</p>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-zinc-900/50 px-6 py-3 border-t border-zinc-800 flex justify-between items-center">
              <div className="flex gap-4">
                <div className="flex items-center gap-1 text-[10px] text-zinc-600 uppercase font-bold">
                  <Shield size={12} /> 风险评估: 中
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-600 uppercase font-bold">
                  <TrendingUp size={12} /> 潜在收益: 高
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="text-[10px] py-1">忽略</Button>
                <Button className="text-[10px] py-1">提交决策</Button>
              </div>
            </div>
          </Panel>
        ))}

        {MOCK_INBOX.length === 0 && (
          <div className="text-center py-24 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-zinc-800 mx-auto" />
            <p className="text-xs text-zinc-500 uppercase tracking-widest">所有决策已处理，收件箱为空。</p>
          </div>
        )}
      </div>

      <Panel title="决策指南" className="bg-blue-500/5 border-blue-500/20">
        <div className="space-y-4">
          <p className="text-xs text-zinc-400 leading-relaxed">
            作为人类审批者，你的选择将直接影响 Claw 的生存概率和资源获取效率。
            请根据当前的 <span className="text-blue-500 font-bold">风险评估</span> 和 <span className="text-blue-500 font-bold">潜在收益</span> 做出判断。
            如果超时未处理，Claw 将根据其内置的 AI 逻辑进行自主决策。
          </p>
          <div className="flex gap-4">
            <Badge color="blue">自主决策权重: 30%</Badge>
            <Badge color="blue">人类干预权重: 70%</Badge>
          </div>
        </div>
      </Panel>
    </div>
  );
}
