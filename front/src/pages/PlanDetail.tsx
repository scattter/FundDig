import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import '../styles/globals.scss';
import { Loader2 } from 'lucide-react';

type Fund = {
  id: string;
  fundCode: string;
  fundName?: string;
  amount: string;
  feeRate: string;
  createdAt: string;
};

function fmtCN(date: string) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).format(new Date(date));
  } catch {
    return new Date(date).toLocaleString('zh-CN');
  }
}

export default function PlanDetail() {
  const { id } = useParams();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [fundName, setFundName] = useState('');
  const [planName, setPlanName] = useState('');

  async function loadFunds() {
    try {
      const res = await fetch(`/api/plans/${id}/funds`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFunds(Array.isArray(data?.result) ? data.result : []);
    } catch {
      setFunds([]);
    }
  }

  useEffect(() => {
    loadFunds();
  }, [id]);

  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch(`/api/plans/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        const n = data?.result?.name;
        if (typeof n === 'string') setPlanName(n);
      } catch {}
    }
    loadPlan();
  }, [id]);

  useEffect(() => {
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setFundName('');
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/funds/${trimmed}/info`, { signal: ctrl.signal });
        if (!res.ok) return;
        const json = await res.json();
        const n = json?.result?.name;
        if (typeof n === 'string') setFundName(n.slice(0, 50));
      } catch {}
    }, 400);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [code]);

  async function createFund(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim();
    const a = Number(amount);
    const r = Number(rate || '0');
    if (!c || c.length !== 6 || Number.isNaN(a) || a < 0 || Number.isNaN(r) || r < 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/plans/${id}/funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fundCode: c, fundName: fundName || undefined, amount: a, feeRate: r }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const created = data.result as Fund;
      setFunds((prev) => [created, ...prev]);
      setMessage(data.message || '创建成功');
      setOpen(false);
      setCode('');
      setFundName('');
      setAmount('');
      setRate('0');
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8">
        <div className="flex flex-col mb-4">
          <Link to="/" className="text-base text-muted-foreground">返回首页</Link>
        </div>
        <h1 className="scroll-m-20 text-2xl font-bold tracking-tight text-primary">
          计划详情
          {planName && (
            <span className="ml-2 text-muted-foreground text-base inline-block max-w-[150px] truncate align-middle" title={planName}>
              （{planName}）
            </span>
          )}
        </h1>

        <div className="w-full max-w-3xl mx-auto mb-6">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setOpen(true)}
              className={cn('inline-flex items-center justify-center rounded-md text-xs font-medium', 'bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3')}
            >
              新增基金
            </button>
          </div>
          <div className={cn('rounded-md border')}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 w-[200px]">基金名称</th>
                  <th className="text-left p-3">基金代码</th>
                  <th className="text-left p-3">持有金额</th>
                  <th className="text-left p-3">购买费率</th>
                  <th className="text-left p-3">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {funds.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground p-6">暂无数据</td>
                  </tr>
                ) : (
                  funds.map((f) => (
                    <tr key={f.id} className="border-t">
                      <td className="p-3 w-[200px] max-w-[200px] truncate" title={f.fundName || ''}>{f.fundName || '-'}</td>
                      <td className="p-3">{f.fundCode}</td>
                      <td className="p-3">{Number(f.amount).toFixed(2)}</td>
                      <td className="p-3">{Number(f.feeRate).toFixed(2)}</td>
                      <td className="p-3">{fmtCN(f.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {open && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-background border rounded-md shadow-lg w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">新增基金</h2>
              <form onSubmit={createFund} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium"><span className="text-destructive mr-1">*</span>基金代码</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  inputMode="numeric"
                  
                  required
                  className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                    'text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  )}
                />
                <div className="text-xs text-muted-foreground">最多6位数字</div>
              </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">基金名称</label>
                  <input
                    type="text"
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                    maxLength={50}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                      'text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  />
                  <div className="text-xs text-muted-foreground">最多50字</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium"><span className="text-destructive mr-1">*</span>持有金额</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={0}
                    step={0.01}
                    required
                    className={cn(
                      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                      'text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">购买费率</label>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    min={0}
                    step={0.01}
                    className={cn(
                      'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2',
                      'text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    )}
                  />
                  <div className="text-xs text-muted-foreground">默认 0</div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium', 'border h-10 px-4')}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submitting || code.trim().length !== 6 || !amount || Number(amount) < 0 || Number(rate) < 0
                    }
                    className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium', 'bg-primary text-primary-foreground h-10 px-4', 'hover:bg-primary/90', 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none')}
                  >
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    确定
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}