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
  changeCount: number;
};

type FundChange = {
  id: string;
  oldAmount: string | null;
  newAmount: string | null;
  oldFeeRate: string | null;
  newFeeRate: string | null;
  createdAt: string;
  opType: string | null;
  opAmount: string | null;
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

function fmtCN(date: string) {
  try {
    const d = new Date(date);
    // Subtract 8 hours
    const d8 = new Date(d.getTime() - 8 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).format(d8);
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
  const [confirmFundId, setConfirmFundId] = useState<string | null>(null);
  const [editFund, setEditFund] = useState<Fund | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editRate, setEditRate] = useState('');
  const [opFund, setOpFund] = useState<Fund | null>(null);
  const [opType, setOpType] = useState<'add' | 'reduce'>('add');
  const [opAmount, setOpAmount] = useState('');
  const [opRate, setOpRate] = useState('0');

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<FundChange[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentHistoryFund, setCurrentHistoryFund] = useState<Fund | null>(null);

  function openCreate() {
    setCode('');
    setFundName('');
    setAmount('');
    setRate('0');
    setMessage('');
    setOpen(true);
  }

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();

    async function loadFunds() {
      try {
        const res = await fetch(`http://localhost:3001/plans/${id}/funds`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setFunds(Array.isArray(data?.result) ? data.result : []);
      } catch (err: any) {
        if (err.name !== 'AbortError') setFunds([]);
      }
    }

    async function loadPlan() {
      try {
        const res = await fetch(`http://localhost:3001/plans/${id}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        const n = data?.result?.name;
        if (typeof n === 'string') setPlanName(n);
      } catch {
        // ignore
      }
    }

    loadFunds();
    loadPlan();

    return () => {
      ctrl.abort();
    };
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
        const res = await fetch(`http://localhost:3001/funds/${trimmed}/info`, { signal: ctrl.signal });
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
      const res = await fetch(`http://localhost:3001/plans/${id}/funds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fundCode: c, fundName: fundName || undefined, amount: a, feeRate: r }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errData.message || 'Request failed');
      }
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

  async function deleteFund(fid: string) {
    try {
      const res = await fetch(`http://localhost:3001/plans/${id}/funds/${fid}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.code === 200 && data.result === true) {
        setFunds((prev) => prev.filter((f) => f.id !== fid));
        setMessage('删除成功');
      }
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    } finally {
      setConfirmFundId(null);
    }
  }

  function openEdit(f: Fund) {
    setEditFund(f);
    setEditAmount(String(Number(f.amount)));
    setEditRate(String(Number(f.feeRate)));
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editFund) return;
    const a = Number(editAmount);
    const r = Number(editRate || '0');
    if (Number.isNaN(a) || a < 0 || Number.isNaN(r) || r < 0) return;
    try {
      const res = await fetch(`http://localhost:3001/plans/${id}/funds/${editFund.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: a, feeRate: r }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const updated = data.result as Fund;
      setFunds((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setMessage('更新成功');
      setEditFund(null);
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    }
  }

  function openOp(f: Fund) {
    setOpFund(f);
    setOpType('add');
    setOpAmount('');
    setOpRate('0');
  }

  async function submitOp(e: React.FormEvent) {
    e.preventDefault();
    if (!opFund) return;
    const delta = Number(opAmount);
    const r = Number(opRate); // '0' is default but user input string can be parsed
    const currentAmount = Number(opFund.amount);

    if (Number.isNaN(delta) || delta <= 0) {
      setMessage('金额必须大于0');
      return;
    }
    if (opType === 'reduce' && delta > currentAmount) {
      setMessage('减仓金额不能超过持有金额');
      return;
    }
    if (Number.isNaN(r) || r < 0 || r > 100) {
      setMessage('费率必须在 0 到 100 之间');
      return;
    }
    if (!/^\d+(\.\d{0,4})?$/.test(String(r))) {
      setMessage('费率最多支持4位小数');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/plans/${id}/funds/${opFund.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opType: opType, opAmount: delta, feeRate: r }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const updated = data.result as Fund;
      setFunds((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setMessage(opType === 'add' ? '加仓成功' : '减仓成功');
      setOpFund(null);
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    }
  }

  async function openHistory(f: Fund) {
    setCurrentHistoryFund(f);
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryList([]);
    try {
      const res = await fetch(`http://localhost:3001/plans/${id}/funds/${f.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(Array.isArray(data?.result) ? data.result : []);
      } else {
        setHistoryList([]);
      }
    } catch (e) {
      console.error(e);
      setHistoryList([]);
    } finally {
      setHistoryLoading(false);
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
              onClick={openCreate}
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
                            onClick={() => openEdit(f)}
                          >编辑</button>
                          <button
                            className={cn('border rounded-md px-2 h-8 text-xs')}
                            onClick={() => openOp(f)}
                          >加减仓</button>
                          <button
                            className={cn('border rounded-md px-2 h-8 text-xs relative')}
                            onClick={() => openHistory(f)}
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
                                  onClick={() => deleteFund(f.id)}
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

        {editFund && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-background border rounded-md shadow-lg w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">编辑基金</h2>
              <form onSubmit={submitEdit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">基金代码</label>
                  <input
                    type="text"
                    value={editFund.fundCode}
                    disabled
                    className={cn('flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">基金名称</label>
                  <input
                    type="text"
                    value={editFund.fundName || ''}
                    disabled
                    className={cn('flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium"><span className="text-destructive mr-1">*</span>持有金额</label>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    min={0}
                    step={0.01}
                    required
                    className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">购买费率</label>
                  <input
                    type="number"
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    min={0}
                    step={0.01}
                    className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm')}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditFund(null)}
                    className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium', 'border h-10 px-4')}
                  >取消</button>
                  <button
                    type="submit"
                    className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium', 'bg-primary text-primary-foreground h-10 px-4 hover:bg-primary/90')}
                  >确定</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {opFund && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-background border rounded-md shadow-lg w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">基金加减仓</h2>
              <form onSubmit={submitOp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium"><span className="text-destructive mr-1">*</span>类型</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="opType"
                        value="add"
                        checked={opType === 'add'}
                        onChange={() => setOpType('add')}
                      />
                      加仓
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="opType"
                        value="reduce"
                        checked={opType === 'reduce'}
                        onChange={() => setOpType('reduce')}
                      />
                      减仓
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium"><span className="text-destructive mr-1">*</span>金额</label>
                  <input
                    type="number"
                    value={opAmount}
                    onChange={(e) => setOpAmount(e.target.value)}
                    min={0.01}
                    step={0.01}
                    required
                    className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm')}
                  />
                  {opType === 'reduce' && opFund && Number(opAmount) > Number(opFund.amount) && (
                    <div className="text-xs text-destructive mt-1">减仓金额超过现有持仓金额 ({Number(opFund.amount).toFixed(2)})</div>
                  )}
                  {opType === 'reduce' && opFund && Number(opAmount) <= Number(opFund.amount) && (
                    <div className="text-xs text-muted-foreground">当前持仓: {Number(opFund.amount).toFixed(2)}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium"><span className="text-destructive mr-1">*</span>费率 (%)</label>
                  <input
                    type="number"
                    value={opRate}
                    onChange={(e) => setOpRate(e.target.value)}
                    min={0}
                    max={100}
                    step={0.0001}
                    required
                    className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm')}
                  />
                  <div className="text-xs text-muted-foreground">范围 0 - 100, 最多4位小数</div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpFund(null)}
                    className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium', 'border h-10 px-4')}
                  >取消</button>
                  <button
                    type="submit"
                    className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium', 'bg-primary text-primary-foreground h-10 px-4 hover:bg-primary/90')}
                  >确定</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {historyOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-background border rounded-md shadow-lg w-full max-w-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">操作记录 - {currentHistoryFund?.fundName}</h2>
                <button onClick={() => setHistoryOpen(false)} className="text-muted-foreground hover:text-foreground">
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
                    {historyLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center p-6">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : historyList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground p-6">暂无记录</td>
                      </tr>
                    ) : (
                      historyList.map((item) => (
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
                  onClick={() => setHistoryOpen(false)}
                  className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium', 'border h-10 px-4')}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
