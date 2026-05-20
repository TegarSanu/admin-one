"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreHorizontal, DollarSign, Building2, User, Clock, ArrowRight, RefreshCw } from "lucide-react";
import moment from "moment";
import AddLeadModal from "@/components/admin/crm/AddLeadModal";
import CustomerDetails from "@/components/admin/crm/CustomerDetails";

const STAGES = [
  { id: 'New', title: 'Incoming' },
  { id: 'Contacted', title: 'Contacted' },
  { id: 'Qualified', title: 'Qualified' },
  { id: 'Proposal', title: 'Proposal' },
  { id: 'Negotiation', title: 'Negotiation' },
  { id: 'Closed Won', title: 'Won' },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalStage, setAddModalStage] = useState("New");

  const fetchLeads = () => {
    setLoading(true);
    fetch('/api/admin/crm/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data.leads || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch leads", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const getStageDeals = (stageId: string) => {
    return leads.filter(l => l.status === stageId);
  };

  const getStageTotal = (stageId: string) => {
    const stageDeals = getStageDeals(stageId);
    return stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
  };

  const totalPipelineValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);

  return (
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Sales Pipeline</h1>
          <p className="text-muted-foreground mt-1 font-medium">Visualize and manage your deals lifecycle.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchLeads}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
          </button>
          <div className="flex items-center gap-4 bg-muted px-4 py-2 rounded-xl border border-border mr-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pipeline Value</span>
              <span className="text-sm font-black text-foreground">${totalPipelineValue.toLocaleString()}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              setAddModalStage("New");
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10"
          >
            <Plus className="w-4 h-4" />
            New Deal
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar min-h-0 items-start">
        {STAGES.map((column) => {
          const columnDeals = getStageDeals(column.id);
          const columnTotal = getStageTotal(column.id);

          return (
            <div key={column.id} className="w-80 shrink-0 flex flex-col max-h-full">
              <div className="glass-panel p-4 rounded-2xl mb-4 border-b-4 border-b-foreground/10">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{column.title}</h3>
                  <button className="p-1 hover:bg-muted rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{columnDeals.length} Deals</span>
                  <span className="text-xs font-black text-foreground">${columnTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar p-1">
                {loading && leads.length === 0 ? (
                  <div className="flex justify-center py-10 opacity-20">
                    <div className="w-6 h-6 border-2 border-foreground/50 border-t-foreground rounded-full animate-spin" />
                  </div>
                ) : columnDeals.map((deal) => (
                  <motion.div 
                    key={deal._id}
                    onClick={() => setSelectedLead(deal)}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="glass-panel p-5 rounded-2xl cursor-pointer group hover:border-foreground/20 transition-all shadow-sm hover:shadow-xl hover:shadow-foreground/5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate max-w-[150px]">
                          {deal.company?.name || "Independent"}
                        </span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        deal.priority === 'High' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 
                        deal.priority === 'Medium' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-sky-500'
                      }`} />
                    </div>
                    
                    <h4 className="text-sm font-bold text-foreground mb-4 group-hover:text-foreground/80 transition-colors leading-snug">{deal.name}</h4>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-black text-foreground">${deal.value.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center -space-x-2">
                        <div className="w-7 h-7 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] font-black uppercase">
                          {deal.name.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      <Clock className="w-3 h-3" />
                      {deal.lastContacted ? `Contacted ${moment(deal.lastContacted).fromNow()}` : 'No contact yet'}
                    </div>
                  </motion.div>
                ))}
                
                <button 
                  onClick={() => {
                    setAddModalStage(column.id);
                    setIsAddModalOpen(true);
                  }}
                  className="w-full py-4 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/30 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Opportunity
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <CustomerDetails 
        customer={selectedLead} 
        onClose={() => setSelectedLead(null)} 
        onUpdate={fetchLeads} 
      />

      <AddLeadModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchLeads} 
        defaultStatus={addModalStage}
      />
    </div>
  );
}
