"use client";

import { motion } from "framer-motion";
import { User, Shield, Bell, Globe, Mail, Save } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'general', name: 'General', icon: Globe },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Manage your account preferences and system configuration.</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-foreground text-background shadow-lg shadow-foreground/10' 
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 glass-panel rounded-2xl p-8"
        >
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-2xl bg-foreground text-background flex items-center justify-center font-black text-2xl">
                  AD
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Avatar Image</h3>
                  <p className="text-xs text-muted-foreground mt-1">Min 400x400px, PNG or JPG</p>
                  <div className="flex gap-2 mt-3">
                    <button className="px-3 py-1.5 bg-muted text-foreground rounded-lg text-xs font-bold hover:bg-muted/80">Upload</button>
                    <button className="px-3 py-1.5 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-500/10">Remove</button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</label>
                  <input type="text" defaultValue="Admin User" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" defaultValue="admin@example.com" className="w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all" />
                  </div>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Bio</label>
                  <textarea rows={4} className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all resize-none" placeholder="Write something about yourself..." />
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-xl text-sm font-bold hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Password Configuration</h3>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Current Password</label>
                    <input type="password" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">New Password</label>
                    <input type="password" className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 transition-all" />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border">
                <h3 className="text-lg font-bold text-foreground mb-4">Two-Factor Authentication</h3>
                <div className="p-4 bg-muted/30 rounded-2xl flex items-center justify-between border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Status: Disabled</p>
                      <p className="text-xs text-muted-foreground">Secure your account with 2FA</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-foreground text-background rounded-lg text-xs font-bold">Enable Now</button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab !== 'profile' && activeTab !== 'security' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-muted-foreground opacity-30" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Under Construction</h3>
              <p className="text-sm text-muted-foreground mt-1">This section is coming soon.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
