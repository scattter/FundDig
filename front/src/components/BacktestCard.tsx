import { useState } from 'react';
import { Calendar, Wallet, Pencil, Trash2 } from 'lucide-react';
import { Backtest } from '../types';
import { fmtCN } from '../lib/utils';
import { COLORS } from '../constants';

export function BacktestCard({ bt, onEdit, onDelete }: { bt: Backtest; onEdit: (bt: Backtest) => void; onDelete: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);

  const sortedFunds = [...bt.funds].sort((a, b) => Number(b.percentage) - Number(a.percentage));

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

      <div className="p-4 flex-1 min-h-[200px]">
        <div className="space-y-2">
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

      <div className="p-4 border-t bg-muted/5 space-y-2">
        <div className="text-xs font-medium text-muted-foreground">回测时间范围</div>
      </div>
    </div>
  );
}
