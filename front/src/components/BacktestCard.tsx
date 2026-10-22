import { useState } from 'react';
import { Calendar, Wallet, Pencil, Trash2, Sparkles, Loader2, Activity } from 'lucide-react';
import { Backtest } from '../types';
import { fmtCN } from '../lib/utils';
import { COLORS } from '../constants';

const AI_TEMPLATE = "查询当前基金组合2025年的最大回撤, 组合收益, 夏普比率, 波动率";

export function BacktestCard({ bt, onEdit, onDelete, onRunAI }: { 
  bt: Backtest; 
  onEdit: (bt: Backtest) => void; 
  onDelete: (id: string) => void;
  onRunAI: (btId: string, prompt: string) => Promise<string>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'ai' | 'strict'>('ai');

  const sortedFunds = [...bt.funds].sort((a, b) => Number(b.percentage) - Number(a.percentage));

  async function handleRunAI() {
    if (!prompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await onRunAI(bt.id, prompt);
      try {
        const json = JSON.parse(res);
        setAiResult(json);
      } catch {
        setAiResult({ error: '解析结果失败', raw: res });
      }
    } catch (e) {
      setAiResult({ error: 'AI分析失败，请稍后重试' });
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="group bg-card rounded-xl border shadow-sm transition-all hover:shadow-md hover:border-primary/20 flex flex-col h-full">
      <div className="flex flex-col p-4 border-b bg-muted/5 gap-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-base tracking-tight text-foreground truncate flex-1" title={bt.name}>
            {bt.name || '未命名组合'}
          </h4>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(bt)}
              className="p-1 hover:bg-muted rounded-full text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
              title="编辑组合"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setConfirming(true)}
                className="p-1 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                title="删除组合"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {confirming && (
                <div className="absolute right-0 top-full mt-2 z-10 bg-background border rounded-md shadow-lg p-3 min-w-[160px]">
                  <div className="text-sm mb-3 font-medium">确认删除该组合？</div>
                  <div className="flex justify-end gap-2">
                    <button
                      className="border border-input rounded-md px-2 h-7 text-xs bg-background hover:bg-muted"
                      onClick={() => setConfirming(false)}
                    >取消</button>
                    <button
                      className="bg-destructive text-destructive-foreground rounded-md px-2 h-7 text-xs hover:bg-destructive/90"
                      onClick={() => {
                        onDelete(bt.id);
                        setConfirming(false);
                      }}
                    >删除</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{fmtCN(bt.createdAt).split(' ')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            <span className="font-mono font-medium">¥{Number(bt.totalAmount).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 min-h-[200px] flex flex-col">
        <div className="space-y-2 flex-1">
          {sortedFunds.map((f, i) => (
            <div key={i} className="flex items-center justify-between text-sm group/item hover:bg-muted/50 p-1 rounded cursor-default">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="truncate" title={f.fundName}>{f.fundName}</span>
              </div>
              <span className="font-mono text-muted-foreground w-[45px] text-right text-xs flex-shrink-0">{f.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {activeTab === 'ai' && (
        <div className="p-4 border-t bg-muted/10 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-1 text-primary">
              <Sparkles className="w-3 h-3" />
              AI 智能回测
            </span>
            <button 
              onClick={() => setPrompt(AI_TEMPLATE)}
              className="text-[10px] text-muted-foreground hover:text-primary underline decoration-dotted"
            >
              使用模板
            </button>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={200}
            placeholder="输入您的回测要求..."
            className="w-full min-h-[80px] p-2 text-xs rounded border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">{prompt.length}/200</span>
            <button
              onClick={handleRunAI}
              disabled={aiLoading || !prompt.trim()}
              className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
            >
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              开始回测
            </button>
          </div>
          {aiResult && (
            <div className="mt-3 p-3 bg-background border rounded text-xs text-muted-foreground">
              {aiResult.error ? (
                <div className="text-destructive">{aiResult.error}</div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/30 p-2 rounded">
                      <div className="text-[10px] text-muted-foreground mb-0.5">最大回撤</div>
                      <div className="text-sm font-medium text-foreground">{aiResult.maxDrawdown}%</div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <div className="text-[10px] text-muted-foreground mb-0.5">组合收益</div>
                      <div className={`text-sm font-medium ${Number(aiResult.accumProfitRate) >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {Number(aiResult.accumProfitRate) > 0 ? '+' : ''}{aiResult.accumProfitRate}%
                      </div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <div className="text-[10px] text-muted-foreground mb-0.5">夏普比率</div>
                      <div className="text-sm font-medium text-foreground">{aiResult.sharpRate}</div>
                    </div>
                    <div className="bg-muted/30 p-2 rounded">
                      <div className="text-[10px] text-muted-foreground mb-0.5">波动率</div>
                      <div className="text-sm font-medium text-foreground">{aiResult.volatility}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center border-t">
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 flex items-center justify-center gap-2 p-3 text-xs font-medium transition-colors ${activeTab === 'ai' ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
        >
          <Sparkles className="w-4 h-4" />
          AI回测
        </button>
        <div className="w-[1px] bg-border h-6 self-center" />
        <button
          className={`flex-1 flex items-center justify-center gap-2 p-3 text-xs font-medium transition-colors text-muted-foreground cursor-not-allowed opacity-50`}
          title="暂未开放"
        >
          <Activity className="w-4 h-4" />
          严格回测
        </button>
      </div>
    </div>
  );
}
