"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Target, ArrowUpRight, ArrowDownRight, Briefcase, RefreshCw } from "lucide-react";

const COLORS = ['hsl(var(--foreground))', 'hsl(var(--muted-foreground))', 'hsl(var(--border))', 'hsl(var(--muted))'];

export default function CRMDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch CRM stats", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
        <p className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Recalculating Revenue Streams...</p>
      </div>
    );
  }

  const { stats, charts } = data || { 
    stats: { totalRevenue: 0, winRate: 0, totalLeads: 0, avgDealSize: 0 },
    charts: { revenueData: [], sourceData: [] }
  };

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Sales Analytics</h1>
          <p className="text-muted-foreground mt-1 font-medium">Performance insights and revenue forecasting.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchStats}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
          </button>
          <select className="bg-muted text-foreground text-xs font-bold px-4 py-2.5 rounded-xl border border-border outline-none">
            <option>Last 6 Months</option>
            <option>Last 12 Months</option>
            <option>Year to Date</option>
          </select>
          <button className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10">
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monthly Revenue</span>
          </div>
          <h3 className="text-2xl font-black text-foreground">${stats.totalRevenue.toLocaleString()}</h3>
          <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> +12.4% vs last month
          </p>
        </div>
        
        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Win Rate</span>
          </div>
          <h3 className="text-2xl font-black text-foreground">{stats.winRate.toFixed(1)}%</h3>
          <p className="text-xs font-bold text-emerald-500 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-4 h-4" /> +2.1% improvement
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Leads</span>
          </div>
          <h3 className="text-2xl font-black text-foreground">{stats.totalLeads}</h3>
          <p className="text-xs font-bold text-rose-500 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-4 h-4" /> -4.2% drop
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg. Deal Size</span>
          </div>
          <h3 className="text-2xl font-black text-foreground">${stats.avgDealSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
          <p className="text-xs font-bold text-muted-foreground mt-2">Steady across Q3</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[400px]">
        <div className="lg:col-span-2 glass-panel p-8 rounded-[2rem] flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-foreground tracking-tight">Revenue vs Forecast</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Forecast</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--foreground)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--foreground)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted-foreground)' }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--foreground)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="forecast" stroke="var(--muted-foreground)" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-[2rem] flex flex-col gap-6">
          <h3 className="text-lg font-black text-foreground tracking-tight">Lead Sources</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.sourceData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full grid grid-cols-2 gap-4 mt-4">
              {charts.sourceData.map((item: any, index: number) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-[10px] font-black text-muted-foreground uppercase truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
