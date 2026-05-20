"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowUpRight, 
  Users, 
  Activity, 
  ShoppingCart, 
  TrendingUp, 
  Briefcase, 
  Trello, 
  FolderOpen, 
  History, 
  ArrowRight 
} from "lucide-react";
import AnalyticsChart from "@/components/admin/AnalyticsChart";

type Stat = { label: string; value: string; trend: string; icon?: any };
type User = { id: string; name: string; email: string; role: string; status: string };

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [statsRaw, setStatsRaw] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analyticsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/analytics'),
          fetch('/api/admin/users?limit=5')
        ]);

        const statsData = await statsRes.json();
        const analytics = await analyticsRes.json();
        const users = await usersRes.json();

        setStatsRaw(statsData);
        setTotalUsersCount(users.total || 0);

        // Manually construct stats array from API data to map correctly to icons
        const statsArray = [
          {
            label: "Total Users",
            value: users.total?.toLocaleString() || "0",
            trend: "+12%"
          },
          {
            label: "Active Activities",
            value: statsData.stats?.totalActivities?.toLocaleString() || "0",
            trend: "+5%"
          },
          {
            label: "Total Revenue",
            value: `$${statsData.stats?.totalRevenue?.toLocaleString() || "0"}`,
            trend: "+24%"
          },
          {
            label: "Win Rate",
            value: `${statsData.stats?.winRate?.toFixed(1) || "0"}%`,
            trend: "+4.2%"
          }
        ];

        // Map icons to stats
        const icons = [Users, Activity, ShoppingCart, TrendingUp];
        setStats(statsArray.map((s: any, i: number) => ({ ...s, icon: icons[i] })));
        setAnalyticsData(analytics.revenue || []);
        setRecentUsers(users.users || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2 font-medium">Welcome back. Here is what's happening today.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 btn-accent rounded-lg text-sm font-bold shadow-lg self-start">
          Download Report
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="glass-panel rounded-2xl animate-pulse h-32 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-700/50 mix-blend-overlay" />
             </div>
          ))
        ) : (
          stats.map((stat, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group cursor-pointer stat-card-hover transition-all duration-300"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl accent-icon-box flex items-center justify-center group-hover:bg-[var(--accent)] group-hover:text-[var(--accent-foreground)] transition-colors duration-300">
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <span className={`flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide border ${
                    stat.trend.startsWith('+') 
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {stat.trend}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">{stat.label}</h3>
                <p className="text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-2 glass-panel rounded-2xl p-8 relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Revenue Growth</h2>
              <p className="text-sm text-muted-foreground">Monthly performance metrics</p>
            </div>
            <select className="bg-muted/50 border border-border rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 focus:ring-foreground/20">
              <option>Last 12 Months</option>
              <option>Last 6 Months</option>
              <option>Last 3 Months</option>
            </select>
          </div>
          
          {loading ? (
            <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-xl" />
          ) : (
            <AnalyticsChart data={analyticsData} />
          )}
        </motion.div>

        {/* Recent Signups Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-panel rounded-2xl p-8 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Recent Signups</h2>
            <Link href="/admin/users">
              <button className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">View All</button>
            </Link>
          </div>
          
          <div className="flex-1 space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted/20 animate-pulse rounded-xl" />
              ))
            ) : recentUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-10">
                <Users className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs font-medium uppercase tracking-widest">No users found</p>
              </div>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors group cursor-pointer border border-transparent hover:border-border">
                  <div className="w-10 h-10 rounded-full accent-icon-box-solid flex items-center justify-center font-black text-sm transition-transform group-hover:scale-110">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                </div>
              ))
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-border/50">
            <div className="btn-accent p-4 rounded-xl flex items-center justify-between group cursor-pointer">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Weekly Goal</p>
                <p className="text-lg font-black tracking-tight">85% Complete</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-background/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Premium Features Summary Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="glass-panel rounded-3xl p-8 space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-foreground/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              System Modules & Features Summary
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Overview of the fully integrated business logic modules provided in this admin suite.</p>
          </div>
          <div className="bg-foreground/5 border border-border px-3 py-1.5 rounded-full text-xs font-bold text-foreground">
            {statsRaw?.stats?.totalLeads ? `${statsRaw.stats.totalLeads} Active Leads` : "Live Sync Active"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* CRM Module Card */}
          <Link href="/admin/crm">
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              className="group glass-panel p-6 rounded-2xl border border-border/50 hover:border-violet-500/30 hover:bg-violet-500/[0.02] cursor-pointer transition-all duration-300 flex flex-col justify-between h-full space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:bg-violet-500 group-hover:text-white transition-all duration-300">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-violet-500 transition-colors">CRM & Sales Pipeline</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sales pipeline control including lead tracking, deal values, company directories, and client analytics.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-violet-500/15 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
                  {statsRaw?.stats?.totalRevenue ? `$${statsRaw.stats.totalRevenue.toLocaleString()} pipeline` : "Sales Active"}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </Link>

          {/* Users IAM Module Card */}
          <Link href="/admin/users">
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              className="group glass-panel p-6 rounded-2xl border border-border/50 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] cursor-pointer transition-all duration-300 flex flex-col justify-between h-full space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-emerald-500 transition-colors">Identity & Access (IAM)</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Manage administrative accounts, role levels (Admin, Editor, User), status toggles, and security logs.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  {totalUsersCount ? `${totalUsersCount} accounts` : "IAM Active"}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </Link>

          {/* Kanban Card */}
          <Link href="/admin/kanban">
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              className="group glass-panel p-6 rounded-2xl border border-border/50 hover:border-amber-500/30 hover:bg-amber-500/[0.02] cursor-pointer transition-all duration-300 flex flex-col justify-between h-full space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                  <Trello className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-amber-500 transition-colors">Interactive Kanban</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Drag-and-drop workflow status boards, task card priorities, real-time collaboration, and tracking lanes.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  Trello-based
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </Link>

          {/* Audit Logs Card */}
          <Link href="/admin/activity">
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              className="group glass-panel p-6 rounded-2xl border border-border/50 hover:border-rose-500/30 hover:bg-rose-500/[0.02] cursor-pointer transition-all duration-300 flex flex-col justify-between h-full space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-rose-500 transition-colors">Security Audit Logs</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Real-time activity logs capturing system actions (Create, Update, Login) linked to active users with IP addresses.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                  {statsRaw?.stats?.totalActivities ? `${statsRaw.stats.totalActivities} operations` : "Logs Active"}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </Link>

          {/* Media Card */}
          <Link href="/admin/media">
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              className="group glass-panel p-6 rounded-2xl border border-border/50 hover:border-cyan-500/30 hover:bg-cyan-500/[0.02] cursor-pointer transition-all duration-300 flex flex-col justify-between h-full space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-cyan-500 transition-colors">Media Explorer</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  File upload management with folder organization trees, dynamic grids, drag-and-drop actions, and filter controls.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full">
                  Asset Manager
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </Link>

          {/* System Config / Analytics */}
          <Link href="/admin/analytics">
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              className="group glass-panel p-6 rounded-2xl border border-border/50 hover:border-blue-500/30 hover:bg-blue-500/[0.02] cursor-pointer transition-all duration-300 flex flex-col justify-between h-full space-y-4"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground group-hover:text-blue-500 transition-colors">Analytics Dashboard</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deep dive into user growth distributions, device metrics, interactive business charts, and revenue reviews.
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  Real-time aggregates
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}


