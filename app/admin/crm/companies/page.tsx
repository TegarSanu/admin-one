"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Building2,
  Users,
  DollarSign,
  ExternalLink,
  MoreVertical,
  Globe,
  MapPin,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import AddCompanyModal from "@/components/admin/crm/AddCompanyModal";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchCompanies = () => {
    setLoading(true);
    fetch('/api/admin/crm/companies')
      .then(res => res.json())
      .then(data => {
        setCompanies(data.companies || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch companies", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const totalPortfolioValue = companies.reduce((sum, c) => sum + (c.totalValue || 0), 0);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Organization Directory
          </h1>
          <p className="text-muted-foreground mt-1 font-medium">
            Manage B2B relationships and account data.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={fetchCompanies}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10"
          >
            <Plus className="w-4 h-4" />
            Add Company
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-[2rem] overflow-hidden border border-border/50 min-h-[500px] flex flex-col">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between shrink-0">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by company name, industry or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
            />
          </div>
          <div className="flex items-center gap-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4">
            <div className="flex flex-col items-end">
              <span className="text-foreground">Total Portfolio</span>
              <span>${(totalPortfolioValue / 1000000).toFixed(2)}M Value</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <div className="w-10 h-10 border-4 border-foreground/10 border-t-foreground rounded-full animate-spin" />
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Compiling account portfolio...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-40">
              <Building2 className="w-16 h-16" />
              <p className="text-[10px] font-black uppercase tracking-widest">No matching accounts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
              {filteredCompanies.map((company) => (
                <motion.div
                  key={company._id}
                  whileHover={{ y: -4 }}
                  className="glass-panel p-6 rounded-3xl group hover:border-foreground/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center border border-border group-hover:bg-foreground group-hover:text-background transition-colors duration-500">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <button className="p-2 hover:bg-muted rounded-xl transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-black text-foreground tracking-tight group-hover:text-foreground transition-colors">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase mt-1">
                        <span>{company.industry}</span>
                        <span>•</span>
                        <span>{company.size}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Account Value
                        </p>
                        <p className="text-sm font-black text-foreground">
                          ${company.totalValue?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          Active Leads
                        </p>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-sm font-black text-foreground">
                            {company.activeLeads}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {company.address || 'Location Hidden'}
                      </div>
                      {company.website && (
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground hover:underline">
                          <Globe className="w-3.5 h-3.5" />
                          {company.website}
                          <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-muted/10 border-t border-border/50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
          <p>Showing {filteredCompanies.length} of {companies.length} Companies</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors">
              Next Page
            </button>
          </div>
        </div>
      </div>

      <AddCompanyModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchCompanies} 
      />
    </div>
  );
}
