"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Filter, MoreHorizontal, Building2, Phone, Mail, DollarSign, ArrowUpRight, RefreshCw } from "lucide-react";
import moment from "moment";
import CustomerDetails from "@/components/admin/crm/CustomerDetails";
import AddLeadModal from "@/components/admin/crm/AddLeadModal";

export default function CustomersPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = () => {
    setLoading(true);
    // Fetch Leads
    fetch('/api/admin/crm/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data.leads || []);
      })
      .catch(err => console.error("Failed to fetch leads", err));

    // Fetch Stats
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch stats", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Hot': case 'Qualified': case 'Proposal': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Warm': case 'Contacted': case 'Negotiation': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Cold': case 'New': return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      case 'Closed Won': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">CRM Leads</h1>
          <p className="text-muted-foreground mt-1 font-medium">Track and manage your sales prospects.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
          </button>
          <button className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-4 py-2.5 rounded-xl font-bold text-sm transition-all border border-border">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Pipeline Value</p>
          <h3 className="text-2xl font-black text-foreground">${stats?.totalRevenue.toLocaleString() || '0'}</h3>
          <div className="flex items-center gap-1.5 mt-2 text-emerald-500">
            <ArrowUpRight className="w-4 h-4" />
            <span className="text-xs font-bold">+12.5% this month</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Leads</p>
          <h3 className="text-2xl font-black text-foreground">{stats?.totalLeads || '0'}</h3>
          <p className="text-xs font-medium text-muted-foreground mt-2">Currently being tracked</p>
        </div>
        <div className="glass-panel p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Win Rate</p>
          <h3 className="text-2xl font-black text-foreground">{stats?.winRate.toFixed(1) || '0'}%</h3>
          <div className="w-full bg-muted h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-foreground h-full" style={{ width: `${stats?.winRate || 0}%` }} />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-3xl overflow-hidden border border-border/50">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name, company or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
            />
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest px-4">
            <span className="text-foreground">All Leads</span>
            <span>Customers</span>
            <span>Archived</span>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading && leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Accessing Secure Lead Database...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground opacity-20" />
              <div>
                <p className="text-sm font-black text-foreground">No leads found</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Try adjusting your search criteria</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">Lead Name</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">Company</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">Value</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-muted-foreground">Last Contact</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLeads.map((lead) => (
                  <tr 
                    key={lead._id} 
                    onClick={() => setSelectedCustomer(lead)}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-[10px]">
                          {lead.name.split(' ').map((n: any) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-black text-foreground text-sm tracking-tight">{lead.name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{lead.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-bold text-foreground">{lead.company?.name || 'Independent'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex px-2.5 py-1 rounded-md border font-black text-[10px] uppercase tracking-widest ${getStatusStyle(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1">
                        <span className="font-black text-foreground text-sm">${lead.value.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-muted-foreground">
                      {lead.lastContacted ? moment(lead.lastContacted).fromNow() : 'Never'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="px-6 py-4 bg-muted/10 border-t border-border/50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <p>Showing {filteredLeads.length} of {leads.length} Leads</p>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 border border-border rounded-lg opacity-50 cursor-not-allowed">Previous</button>
            <button className="px-3 py-1.5 border border-border rounded-lg hover:bg-muted transition-colors">Next Page</button>
          </div>
        </div>
      </div>

      <CustomerDetails 
        customer={selectedCustomer} 
        onClose={() => setSelectedCustomer(null)} 
        onUpdate={fetchData} 
      />

      <AddLeadModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </div>
  );
}
