import React, { useEffect, useState } from 'react';
import './styles/globals.scss';
import { cn } from './lib/utils';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

type Plan = {
  id: string;
  shortId?: string;
  name: string;
  description?: string;
  createdAt: string;
  fundCount?: number;
};

function App() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [message, setMessage] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState<null | Plan>(null);
  const [editing, setEditing] = useState<null | Plan>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copying, setCopying] = useState<string | null>(null);

  async function loadPlans() {
    try {
      setLoading(true);
      const res = await fetch('/api/plans');
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPlans(Array.isArray(data?.result) ? data.result : []);
    } catch (err: any) {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPlans();
  }, []);

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n || n.length > 50 || desc.length > 200) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, description: desc }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const created = data.result as Plan;
      setPlans((prev) => [{ ...created, createdAt: new Date().toISOString() }, ...prev]);
      setMessage(data.message || '创建成功');
      setOpen(false);
      setName('');
      setDesc('');
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPlan(p: Plan) {
    const newName = `${p.name}_copy`;
    try {
      setCopying(p.id);
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: p.description || '' }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPlans((prev) => [data.result as Plan, ...prev]);
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    } finally {
      setCopying(null);
    }
  }

  async function updatePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const n = name.trim();
    if (!n || n.length > 50 || desc.length > 200) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/plans/${editing.shortId || editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: n, description: desc }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const updated = data.result as Plan;
      setPlans((prev) => prev.map((pl) => (pl.id === updated.id ? { ...pl, ...updated } : pl)));
      setEditOpen(false);
      setEditing(null);
      setName('');
      setDesc('');
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePlan(idOrShort: string) {
    try {
      const res = await fetch(`/api/plans/${idOrShort}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.code === 200) {
        setPlans((prev) => prev.filter((p) => (p.shortId || p.id) !== idOrShort));
      }
      setDeleteOpen(null);
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
            基金持有计划管理
          </h1>
          <button
            onClick={() => setOpen(true)}
            className={cn(
              "inline-flex items-center justify-center rounded-md text-sm font-medium",
              "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4"
            )}
          >
            创建计划
          </button>
        </div>

        <div className="w-full max-w-3xl mx-auto mb-8">
          <div className={cn("rounded-md border")}> 
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 w-[200px]">计划名称</th>
                  <th className="text-left p-3 w-[250px]">描述</th>
                  <th className="text-left p-3">创建时间</th>
                  <th className="text-left p-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted-foreground p-6">暂无数据</td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted-foreground p-6">
                      <span className="inline-flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 加载中...
                      </span>
                    </td>
                  </tr>
                ) : (
                  plans.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-3 w-[200px] max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/plan/${p.shortId || p.id}`}
                            className="text-primary hover:underline inline-block max-w-[160px] truncate"
                            title={p.name}
                          >
                            {p.name}
                          </Link>
                          <span className="inline-flex items-center justify-center rounded bg-secondary text-secondary-foreground text-xs px-1.5">
                            {p.fundCount ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 w-[250px] max-w-[250px]">
                        <span className="inline-block max-w-[250px] truncate" title={p.description || ''}>{p.description || '-'}</span>
                      </td>
                      <td className="p-3">
                        {fmtHoursUTC(p.createdAt)}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            className={cn(
                              "border rounded-md px-2 h-8 text-xs",
                              "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                            )}
                            onClick={() => copyPlan(p)}
                            disabled={copying === p.id}
                          >复制</button>
                          <button
                            className="border rounded-md px-2 h-8 text-xs"
                            onClick={() => {
                              setEditing(p);
                              setName(p.name);
                              setDesc(p.description || '');
                              setEditOpen(true);
                            }}
                          >编辑</button>
                          <button
                            className="border rounded-md px-2 h-8 text-xs text-destructive border-destructive"
                            onClick={() => setDeleteOpen(p)}
                          >删除</button>
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
              <h2 className="text-lg font-semibold mb-4">创建基金持有计划</h2>
              <form onSubmit={createPlan} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium"><span className="text-destructive mr-1">*</span>计划名称</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    required
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
                      "text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  />
                  <div className="text-xs text-muted-foreground">最多50字</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">描述</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    maxLength={200}
                    style={{ resize: 'none' }}
                    className={cn(
                      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2",
                      "text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  />
                  <div className="text-xs text-muted-foreground">最多200字</div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "inline-flex items-center justify-center rounded-md text-sm font-medium",
                      "border h-10 px-4"
                    )}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !name.trim() || name.trim().length > 50 || desc.length > 200}
                    className={cn(
                      "inline-flex items-center justify-center rounded-md text-sm font-medium",
                      "bg-primary text-primary-foreground h-10 px-4",
                      "hover:bg-primary/90",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                    )}
                  >
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    确定
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editOpen && editing && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-background border rounded-md shadow-lg w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">编辑基金持有计划</h2>
              <form onSubmit={updatePlan} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium"><span className="text-destructive mr-1">*</span>计划名称</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    required
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
                      "text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  />
                  <div className="text-xs text-muted-foreground">最多50字</div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">描述</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    maxLength={200}
                    style={{ resize: 'none' }}
                    className={cn(
                      "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2",
                      "text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  />
                  <div className="text-xs text-muted-foreground">最多200字</div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => { setEditOpen(false); setEditing(null); }}
                    className={cn(
                      "inline-flex items-center justify-center rounded-md text-sm font-medium",
                      "border h-10 px-4"
                    )}
                  >取消</button>
                  <button
                    type="submit"
                    disabled={submitting || !name.trim() || name.trim().length > 50 || desc.length > 200}
                    className={cn(
                      "inline-flex items-center justify-center rounded-md text-sm font-medium",
                      "bg-primary text-primary-foreground h-10 px-4",
                      "hover:bg-primary/90",
                      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
                    )}
                  >
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    确定
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-background border rounded-md shadow-lg w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">删除计划确认</h2>
              <p className="text-sm mb-6">确定要删除{deleteOpen.name}计划吗？</p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteOpen(null)}
                  className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium", "border h-10 px-4")}
                >取消</button>
                <button
                  type="button"
                  onClick={() => deletePlan(deleteOpen.shortId || deleteOpen.id)}
                  className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium", "bg-destructive text-destructive-foreground h-10 px-4 hover:bg-destructive/90")}
                >确定</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

function fmtHoursUTC(iso: string) {
  const nowUTC = Date.now();
  const tUTC = new Date(iso).getTime();
  const diffMs = Math.max(0, nowUTC - tUTC);
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return '1小时内';
  return `${hours}小时前`;
}
