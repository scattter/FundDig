import { useState } from 'react';
import { cn } from '../lib/utils';
import { Fund } from '../types';

type FundTableProps = {
  funds: Fund[];
  onEdit: (f: Fund) => void;
  onOp: (f: Fund) => void;
  onHistory: (f: Fund) => void;
  onDelete: (id: string) => void;
};

export function FundTable({ funds, onEdit, onOp, onHistory, onDelete }: FundTableProps) {
  const [confirmFundId, setConfirmFundId] = useState<string | null>(null);

  return (
    <div className={cn('rounded-md border')}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 w-[200px]">基金名称</th>
            <th className="text-left p-3">基金代码</th>
            <th className="text-left p-3">持有金额</th>
            <th className="text-left p-3 w-[260px]">操作</th>
          </tr>
        </thead>
        <tbody>
          {funds.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center text-muted-foreground p-6">暂无数据</td>
            </tr>
          ) : (
            funds.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-3 w-[200px] max-w-[200px] truncate" title={f.fundName || ''}>{f.fundName || '-'}</td>
                <td className="p-3">{f.fundCode}</td>
                <td className="p-3">{Number(f.amount).toFixed(2)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2 relative">
                    <button
                      className={cn('border rounded-md px-2 h-8 text-xs')}
                      onClick={() => onEdit(f)}
                    >编辑</button>
                    <button
                      className={cn('border rounded-md px-2 h-8 text-xs')}
                      onClick={() => onOp(f)}
                    >加减仓</button>
                    <button
                      className={cn('border rounded-md px-2 h-8 text-xs relative')}
                      onClick={() => onHistory(f)}
                    >
                      记录
                      {f.changeCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1 h-4 flex items-center justify-center min-w-[16px]">
                          {f.changeCount}
                        </span>
                      )}
                    </button>
                    <button
                      className={cn('border rounded-md px-2 h-8 text-xs text-destructive border-destructive')}
                      onClick={() => setConfirmFundId(confirmFundId === f.id ? null : f.id)}
                    >
                      删除
                    </button>
                    {confirmFundId === f.id && (
                      <div className="absolute right-0 top-full mt-2 z-10 bg-background border rounded-md shadow-lg p-3 min-w-[240px]">
                        <div className="text-sm mb-3">确认删除该基金？</div>
                        <div className="flex justify-end gap-2">
                          <button
                            className={cn('border border-input rounded-md px-3 h-8 text-xs bg-background hover:bg-muted')}
                            onClick={() => setConfirmFundId(null)}
                          >取消</button>
                          <button
                            className={cn('bg-destructive text-destructive-foreground rounded-md px-3 h-8 text-xs hover:bg-destructive/90')}
                            onClick={() => {
                              onDelete(f.id);
                              setConfirmFundId(null);
                            }}
                          >删除</button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
