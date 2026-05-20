"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, TrendingUp, TrendingDown, Users, Globe, Smartphone, Monitor, Tablet, Download } from "lucide-react";
import AnalyticsChart from "@/components/admin/AnalyticsChart";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'month'>('month');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load analytics:", err);
        setLoading(false);
      });
  }, [period]);

  const deviceIcons = {
    Desktop: Monitor,
    Mobile: Smartphone,
    Tablet: Tablet
  };

  const handleExportData = () => {
    if (!data) return;

    // Construct CSV content beautifully
    const csvRows = [
      ["Date/Time", "Revenue ($)", "Registered Users Count"]
    ];

    const maxLength = Math.max(data.revenue.length, data.userGrowth.length);
    for (let i = 0; i < maxLength; i++) {
      const revRow = data.revenue[i] || { name: "", value: 0 };
      const userRow = data.userGrowth[i] || { name: "", value: 0 };
      csvRows.push([
        revRow.name || userRow.name,
        String(revRow.value),
        String(userRow.value)
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + csvRows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filename = `analytics_${period}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Dynamic state-of-the-art Toast Alert
    setToastMessage(`Export Successful! ${filename} downloaded.`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Deep dive into your system performance and user behavior.</p>
        </div>
        
        {/* State-of-the-art consolidated slider filter */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/40 backdrop-blur-md">
            <button 
              onClick={() => setPeriod('today')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                period === 'today' 
                  ? 'bg-foreground text-background shadow-md shadow-foreground/5' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Today
            </button>
            <button 
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${
                period === 'month' 
                  ? 'bg-foreground text-background shadow-md shadow-foreground/5' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              This Month
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel rounded-3xl p-8 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-foreground">Revenue Over Time</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {period === 'today' ? "Hourly closed sales tracking for today" : "Monthly sales aggregation for the past year"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              +24% vs last period
            </div>
          </div>
          {loading ? (
            <div className="h-[350px] bg-muted/20 animate-pulse rounded-2xl" />
          ) : (
            <div className="h-[350px]">
              <AnalyticsChart 
                data={data?.revenue || []} 
                valueFormatter={(val) => `$${Number(val).toLocaleString()}`}
                gradientId="revenueGrad"
                strokeColor="#10b981"
              />
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="glass-panel rounded-3xl p-8">
            <h2 className="text-lg font-bold text-foreground mb-6">Device Distribution</h2>
            <div className="space-y-6">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-muted/20 animate-pulse rounded-xl" />
                ))
              ) : (
                data?.devices?.map((device: any) => {
                  const Icon = (deviceIcons as any)[device.name];
                  return (
                    <div key={device.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 font-bold text-foreground">
                          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                          {device.name}
                        </div>
                        <span className="font-black text-foreground">{device.value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${device.value}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className="h-full bg-foreground" 
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl p-8 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white relative overflow-hidden shadow-xl shadow-indigo-500/10 border border-indigo-400/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <Globe className="w-6 h-6 text-white/80" />
              <div className="bg-white/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white">Global</div>
            </div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black tracking-tight text-white">142 Countries</h3>
              <p className="text-xs font-bold text-white/80 mt-1 uppercase tracking-widest">Active session locations</p>
              <div className="mt-6 flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-white/15 flex items-center justify-center text-[10px] font-bold text-white">
                    {i}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-indigo-500 bg-white/30 flex items-center justify-center text-[10px] font-bold text-white">
                  +138
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Growth */}
      <div className="glass-panel rounded-3xl p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-foreground">User Growth</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {period === 'today' ? "Hourly cumulative system registrations today" : "Weekly system registration metrics"}
            </p>
          </div>
          <button 
            onClick={handleExportData}
            disabled={loading || !data}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-foreground text-background dark:bg-background dark:text-foreground dark:border dark:border-border rounded-xl text-sm font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className="w-4.5 h-4.5" />
            Export CSV Report
          </button>
        </div>
        
        {loading ? (
          <div className="h-[250px] bg-muted/20 animate-pulse rounded-2xl" />
        ) : (
          <div className="h-[250px]">
             <AnalyticsChart 
               data={data?.userGrowth || []} 
               valueFormatter={(val) => `${Number(val).toLocaleString()}`}
               gradientId="userGrowthGrad"
               strokeColor="#6366f1"
             />
          </div>
        )}
      </div>

      {/* State-of-the-art bottom right custom Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-8 right-8 z-50 bg-foreground text-background dark:bg-background dark:text-foreground border border-border/50 px-6 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 backdrop-blur-lg"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
