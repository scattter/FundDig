import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import '../styles/globals.scss';
import { Loader2, Plus } from 'lucide-react';
import { FundTable } from '../components/FundTable';
import { BacktestCard } from '../components/BacktestCard';
import { HistoryModal } from '../components/HistoryModal';
import { Fund, FundChange, BacktestFundItem, Backtest } from '../types';

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

  const [backtestOpen, setBacktestOpen] = useState(false);
  const [editingBacktestId, setEditingBacktestId] = useState<string | null>(null);
  const [backtestName, setBacktestName] = useState('');
  const [backtestTotal, setBacktestTotal] = useState('10000');
  const [backtestFunds, setBacktestFunds] = useState<BacktestFundItem[]>([]);
  const [backtestList, setBacktestList] = useState<Backtest[]>([]);
  const [backtestSubmitting, setBacktestSubmitting] = useState(false);
  const [loadingRows, setLoadingRows] = useState<Record<number, boolean>>({});

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

    async function loadBacktestsLocal() {
      try {
        const res = await fetch(`http://localhost:3001/plans/${id}/backtests`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = await res.json();
        setBacktestList(Array.isArray(data?.result) ? data.result : []);
      } catch {}
    }

    loadFunds();
    loadPlan();
    loadBacktestsLocal();

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

  function openBacktest() {
    setEditingBacktestId(null);
    setBacktestName('');
    setBacktestTotal('10000');
    setBacktestFunds([{ fundCode: '', fundName: '', percentage: '', amount: '' }]);
    setBacktestOpen(true);
  }

  function openEditBacktest(bt: Backtest) {
    setEditingBacktestId(bt.id);
    setBacktestName(bt.name);
    setBacktestTotal(bt.totalAmount);
    setBacktestFunds(bt.funds.map(f => ({
      fundCode: f.fundCode,
      fundName: f.fundName,
      percentage: f.percentage,
      amount: f.amount
    })));
    setBacktestOpen(true);
  }

  function addBacktestRow() {
    setBacktestFunds([...backtestFunds, { fundCode: '', fundName: '', percentage: '', amount: '' }]);
  }

  function removeBacktestRow(index: number) {
    const next = [...backtestFunds];
    next.splice(index, 1);
    setBacktestFunds(next);
  }

  async function updateBacktestRow(index: number, field: keyof BacktestFundItem, value: string) {
    const next = [...backtestFunds];
    next[index] = { ...next[index], [field]: value };

    if (field === 'percentage') {
      const p = Number(value);
      const t = Number(backtestTotal);
      if (!Number.isNaN(p) && !Number.isNaN(t)) {
        next[index].amount = (t * p / 100).toFixed(2);
      }
    }

    setBacktestFunds(next);

    if (field === 'fundCode' && value.length === 6) {
      setLoadingRows((prev) => ({ ...prev, [index]: true }));
      try {
        const res = await fetch(`http://localhost:3001/funds/${value}/info`);
        if (res.ok) {
          const json = await res.json();
          if (json?.result?.name) {
            setBacktestFunds((prev) => {
              const newFunds = [...prev];
              if (newFunds[index]) {
                newFunds[index] = { ...newFunds[index], fundName: json.result.name };
              }
              return newFunds;
            });
          }
        }
      } catch {
      } finally {
        setLoadingRows((prev) => ({ ...prev, [index]: false }));
      }
    }
  }

  function handleTotalChange(val: string) {
    setBacktestTotal(val);
    const t = Number(val);
    if (Number.isNaN(t)) return;
    const next = backtestFunds.map((f) => {
      const p = Number(f.percentage);
      if (!Number.isNaN(p)) {
        return { ...f, amount: (t * p / 100).toFixed(2) };
      }
      return f;
    });
    setBacktestFunds(next);
  }

  async function submitBacktest(e: React.FormEvent) {
    e.preventDefault();
    if (!backtestName.trim()) {
      setMessage('请输入组合名称');
      return;
    }
    const totalP = backtestFunds.reduce((sum, f) => sum + Number(f.percentage || 0), 0);
    if (Math.abs(totalP - 100) > 0.01) {
      setMessage(`百分比总和必须为 100% (当前: ${totalP.toFixed(2)}%)`);
      return;
    }
    if (backtestFunds.some((f) => !f.fundCode || f.fundCode.length !== 6)) {
      setMessage('请填写正确的基金代码');
      return;
    }
    if (Number(backtestTotal) < 1) {
      setMessage('组合总金额必须大于等于1');
      return;
    }

    setBacktestSubmitting(true);
    try {
      const url = editingBacktestId 
        ? `http://localhost:3001/plans/${id}/backtests/${editingBacktestId}`
        : `http://localhost:3001/plans/${id}/backtests`;
      const method = editingBacktestId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: backtestName.trim(),
          totalAmount: Number(backtestTotal),
          funds: backtestFunds.map((f) => ({
            fundCode: f.fundCode,
            fundName: f.fundName,
            percentage: Number(f.percentage),
            amount: Number(f.amount),
          })),
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errData.message || 'Request failed');
      }
      const data = await res.json();
      if (editingBacktestId) {
        setBacktestList((prev) => prev.map(bt => bt.id === editingBacktestId ? data.result : bt));
        setMessage('更新回测组合成功');
      } else {
        setBacktestList((prev) => [data.result, ...prev]);
        setMessage('创建回测组合成功');
      }
      setBacktestOpen(false);
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    } finally {
      setBacktestSubmitting(false);
    }
  }

  async function loadBacktests() {
    try {
      const res = await fetch(`http://localhost:3001/plans/${id}/backtests`);
      if (!res.ok) return;
      const data = await res.json();
      setBacktestList(Array.isArray(data?.result) ? data.result : []);
    } catch {}
  }

  async function deleteBacktest(btId: string) {
    try {
      const res = await fetch(`http://localhost:3001/plans/${id}/backtests/${btId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.code === 200 && data.result === true) {
        setBacktestList((prev) => prev.filter((bt) => bt.id !== btId));
        setMessage('删除组合成功');
        // Refresh the list to ensure data consistency
        loadBacktests();
      }
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    }
  }

  async function handleRunAI(btId: string, prompt: string): Promise<string> {
    const res = await fetch(`http://localhost:3001/plans/${id}/backtests/${btId}/ai-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const data = await res.json();
    return data.result;
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
          <FundTable
            funds={funds}
            onEdit={openEdit}
            onOp={openOp}
            onHistory={openHistory}
            onDelete={deleteFund}
          />

          <div className="mt-8 mb-40 space-y-6">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <h3>回测组合列表</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {backtestList.map((bt) => (
                <BacktestCard 
                  key={bt.id} 
                  bt={bt} 
                  onEdit={openEditBacktest} 
                  onDelete={deleteBacktest}
                  onRunAI={handleRunAI}
                />
              ))}
              <button
                onClick={openBacktest}
                className="group flex flex-col items-center justify-center h-full min-h-[300px] rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/5 transition-all gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary">创建新组合</span>
              </button>
            </div>
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
          <HistoryModal
            open={historyOpen}
            loading={historyLoading}
            list={historyList}
            currentFund={currentHistoryFund}
            onClose={() => setHistoryOpen(false)}
          />
        )}
        {backtestOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-background border rounded-md shadow-lg w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">创建回测组合</h2>
              <form onSubmit={submitBacktest} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    <span className="text-destructive mr-1">*</span>组合名称
                  </label>
                  <input
                    type="text"
                    value={backtestName}
                    onChange={(e) => setBacktestName(e.target.value)}
                    maxLength={50}
                    required
                    placeholder="例如：保守型定投组合"
                    className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    <span className="text-destructive mr-1">*</span>组合总金额
                  </label>
                  <input
                    type="number"
                    value={backtestTotal}
                    onChange={(e) => handleTotalChange(e.target.value)}
                    min={1}
                    step={0.01}
                    required
                    className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm')}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">基金列表</label>
                    <button
                      type="button"
                      onClick={addBacktestRow}
                      className={cn('text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90')}
                    >
                      添加基金
                    </button>
                  </div>

                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-2 text-left w-[150px]">
                            代码 <span className="text-destructive">*</span>
                          </th>
                          <th className="p-2 text-left">名称</th>
                          <th className="p-2 text-left w-[100px]">
                            百分比(%) <span className="text-destructive">*</span>
                          </th>
                          <th className="p-2 text-left w-[120px]">金额</th>
                          <th className="p-2 text-center w-[60px]">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backtestFunds.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.fundCode}
                                onChange={(e) => updateBacktestRow(idx, 'fundCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="w-full border rounded px-2 py-1"
                                placeholder="代码"
                                list={`funds-list-${idx}`}
                              />
                              <datalist id={`funds-list-${idx}`}>
                                {funds.map((f) => (
                                  <option key={f.id} value={f.fundCode}>
                                    {f.fundName}
                                  </option>
                                ))}
                              </datalist>
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {loadingRows[idx] ? (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span className="text-xs">查询中...</span>
                                </div>
                              ) : (
                                item.fundName || '-'
                              )}
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={item.percentage}
                                onChange={(e) => updateBacktestRow(idx, 'percentage', e.target.value)}
                                className="w-full border rounded px-2 py-1"
                                min={0}
                                max={100}
                                step={0.01}
                              />
                            </td>
                            <td className="p-2 text-muted-foreground">{item.amount}</td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => removeBacktestRow(idx)} className="text-destructive hover:text-destructive/80">
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                        {backtestFunds.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-muted-foreground">
                              请添加基金
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    当前总占比: {backtestFunds.reduce((sum, f) => sum + Number(f.percentage || 0), 0).toFixed(2)}%
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBacktestOpen(false)}
                    className={cn('inline-flex items-center justify-center rounded-md text-sm font-medium', 'border h-10 px-4')}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={backtestSubmitting}
                    className={cn(
                      'inline-flex items-center justify-center rounded-md text-sm font-medium',
                      'bg-primary text-primary-foreground h-10 px-4 hover:bg-primary/90'
                    )}
                  >
                    {backtestSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
