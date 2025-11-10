import React, { useState } from 'react';
import './styles/globals.scss';
import { cn } from './lib/utils';

function App() {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [message, setMessage] = useState('');

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: desc }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessage('创建成功: ' + data.id);
      setName('');
      setDesc('');
    } catch (err: any) {
      setMessage('错误: ' + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-8">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-8 text-primary">
          基金持有计划管理
        </h1>
        
        <div className="w-full max-w-md mx-auto">
          <form onSubmit={createPlan} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                计划名称
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2",
                  "text-sm ring-offset-background file:border-0 file:bg-transparent",
                  "file:text-sm file:font-medium placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                描述
              </label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className={cn(
                  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2",
                  "text-sm ring-offset-background placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              />
            </div>

            <button
              type="submit"
              className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                "bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
              )}
            >
              创建计划
            </button>
          </form>

          {message && (
            <p className={cn(
              "mt-4 p-4 rounded-md",
              message.includes('错误') 
                ? "bg-destructive/15 text-destructive"
                : "bg-primary/15 text-primary"
            )}>
              {message}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
