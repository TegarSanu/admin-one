"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  LogIn,
  Settings,
  Trash2,
  Edit,
  PlusCircle,
  Download,
} from "lucide-react";
import moment from "moment";

const typeConfigs: Record<string, any> = {
  Create: { icon: PlusCircle, color: "text-emerald-500 bg-emerald-500/10" },
  Update: { icon: Edit, color: "text-blue-500 bg-blue-500/10" },
  Delete: { icon: Trash2, color: "text-rose-500 bg-rose-500/10" },
  Login: { icon: LogIn, color: "text-indigo-500 bg-indigo-500/10" },
  Export: { icon: Download, color: "text-amber-500 bg-amber-500/10" },
  System: { icon: Settings, color: "text-slate-500 bg-slate-500/10" },
};

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activity")
      .then((res) => res.json())
      .then((data) => {
        setActivities(data.activities || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch activity logs", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight text-gradient">
          Activity Log
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
          Real-time audit trail of all system events.
        </p>
      </motion.div>

      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2">
            Latest Events
          </span>
          <button className="text-xs font-bold text-foreground hover:underline">
            Refresh
          </button>
        </div>

        <div className="divide-y divide-border/50 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Synchronizing Log Data...
              </p>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-10">
              <History className="w-10 h-10 text-muted-foreground opacity-20" />
              <div>
                <p className="text-sm font-bold text-foreground">
                  No activities recorded yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Actions performed by users will appear here automatically.
                </p>
              </div>
            </div>
          ) : (
            activities.map((activity, i) => {
              const config =
                typeConfigs[activity.type] || typeConfigs["System"];
              const Icon = config.icon;

              return (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-6 flex items-start gap-4 hover:bg-muted/20 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-foreground">
                          {activity.user?.name || "Unknown User"}
                        </p>
                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                          {activity.module}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                        {moment(activity.createdAt).fromNow()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {activity.description}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <div className="p-6 bg-muted/10 text-center border-t border-border/50">
          <button className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
            {activities.length > 0 ? "View Full Audit Trail" : "System Ready"}
          </button>
        </div>
      </div>
    </div>
  );
}
