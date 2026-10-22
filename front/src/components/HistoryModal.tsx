import { Loader2 } from 'lucide-react';
import { cn, fmtCN } from '../lib/utils';
import { Fund, FundChange } from '../types';

type HistoryModalProps = {
  open: boolean;
  loading: boolean;
  list: FundChange[];
  currentFund: Fund | null;
  onClose: () => void;
};

function getOpTypeLabel(type: string | null) {
  switch (type) {
    case 'create': return '初次添加';
    case 'add': return '加仓';
    case 'reduce': return '减仓';
    case 'update': return '手动修改';
    default: return '未知操作';
  }
}

export function HistoryModal({ open, loading, list, currentFund, onClose }: HistoryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background border rounded-md shadow-lg w-full max-w-3xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">操作记录 - {currentFund?.fundName}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        
        <div className="h-[400px] overflow-y-auto border rounded-md">
          <table className="w-full text-sm relative">
            <thead className="sticky top-0 bg-background z-10 shadow-sm">
              <tr className="border-b">
                <th className="p-3 text-left w-[180px]">时间</th>
                <th className="p-3 text-left">操作类型</th>
                <th className="p-3 text-right">操作金额</th>
                <th className="p-3 text-right">变更前金额</th>
                <th className="p-3 text-right">变更后金额</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground p-6">暂无记录</td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-3 text-muted-foreground">{fmtCN(item.createdAt)}</td>
                    <td className="p-3">{getOpTypeLabel(item.opType)}</td>
                    <td className="p-3 text-right font-mono">{item.opAmount ? Number(item.opAmount).toFixed(2) : '-'}</td>
                    <td className="p-3 text-right text-muted-foreground">{item.oldAmount ? Number(item.oldAmount).toFixed(2) : '-'}</td>
                    <td className="p-3 text-right font-medium">{item.newAmount ? Number(item.newAmount).toFixed(2) : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium', 'border h-10 px-4')}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
