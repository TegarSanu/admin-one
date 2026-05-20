"use client";

import { motion } from "framer-motion";
import { Image as ImageIcon, File, Film, MoreVertical, Upload, Grid, List, Search, Download, Trash2, Info } from "lucide-react";
import { useState } from "react";

const mockFiles = [
  { id: 1, name: 'hero-banner.jpg', type: 'image', size: '2.4 MB', date: 'Oct 12, 2023', dimensions: '1920x1080' },
  { id: 2, name: 'logo-dark.svg', type: 'image', size: '45 KB', date: 'Oct 15, 2023', dimensions: '512x512' },
  { id: 3, name: 'product-video.mp4', type: 'video', size: '15.8 MB', date: 'Oct 18, 2023', duration: '0:45' },
  { id: 4, name: 'annual-report.pdf', type: 'document', size: '1.2 MB', date: 'Oct 20, 2023', pages: '24' },
  { id: 5, name: 'user-avatar-01.png', type: 'image', size: '120 KB', date: 'Oct 22, 2023', dimensions: '256x256' },
  { id: 6, name: 'background-pattern.png', type: 'image', size: '850 KB', date: 'Oct 25, 2023', dimensions: '1024x1024' },
  { id: 7, name: 'presentation.pptx', type: 'document', size: '4.5 MB', date: 'Oct 26, 2023', pages: '12' },
  { id: 8, name: 'intro-animation.mov', type: 'video', size: '32.1 MB', date: 'Oct 27, 2023', duration: '0:15' },
];

export default function MediaPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'image': return ImageIcon;
      case 'video': return Film;
      default: return File;
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Media Manager</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage your digital assets and files.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex bg-muted p-1 rounded-xl border border-border">
            <button 
              onClick={() => setView('grid')}
              className={`p-1.5 rounded-lg transition-all ${view === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg transition-all ${view === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10">
            <Upload className="w-4 h-4" />
            Upload File
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
        {/* Main Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Toolbar */}
          <div className="glass-panel p-3 rounded-2xl flex items-center justify-between shrink-0">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search files..." 
                className="w-full pl-10 pr-4 py-1.5 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all"
              />
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest px-4">
              <span>8 Files</span>
              <div className="w-px h-4 bg-border" />
              <span>124.5 MB Total</span>
            </div>
          </div>

          {/* Files Grid/List */}
          <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar">
            {view === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
                {mockFiles.map((file) => {
                  const Icon = getIcon(file.type);
                  const isSelected = selectedFile?.id === file.id;
                  return (
                    <motion.div 
                      key={file.id}
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedFile(file)}
                      className={`group relative glass-panel rounded-2xl overflow-hidden cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-foreground border-transparent' : 'hover:border-foreground/20'
                      }`}
                    >
                      <div className="aspect-square bg-muted/30 flex items-center justify-center relative">
                        <Icon className="w-10 h-10 text-muted-foreground/40 group-hover:scale-110 transition-transform duration-500" />
                        {file.type === 'image' && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <div className="p-3 bg-card border-t border-border/50">
                        <p className="text-[11px] font-bold text-foreground truncate">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{file.size}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-panel rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-6 py-3 font-bold text-muted-foreground uppercase tracking-widest">Name</th>
                      <th className="px-6 py-3 font-bold text-muted-foreground uppercase tracking-widest">Type</th>
                      <th className="px-6 py-3 font-bold text-muted-foreground uppercase tracking-widest">Size</th>
                      <th className="px-6 py-3 font-bold text-muted-foreground uppercase tracking-widest">Date Added</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {mockFiles.map((file) => {
                      const Icon = getIcon(file.type);
                      return (
                        <tr 
                          key={file.id} 
                          onClick={() => setSelectedFile(file)}
                          className={`hover:bg-muted/30 cursor-pointer transition-colors ${selectedFile?.id === file.id ? 'bg-muted/50' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                <Icon className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <span className="font-bold text-foreground">{file.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground capitalize">{file.type}</td>
                          <td className="px-6 py-4 text-muted-foreground">{file.size}</td>
                          <td className="px-6 py-4 text-muted-foreground">{file.date}</td>
                          <td className="px-6 py-4 text-right">
                            <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 shrink-0">
          {selectedFile ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-panel rounded-3xl p-6 h-full flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">File Details</h3>
                <button onClick={() => setSelectedFile(null)} className="p-1.5 hover:bg-muted rounded-lg">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>

              <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center mb-6 border border-border/50 overflow-hidden">
                {(() => {
                  const Icon = getIcon(selectedFile.type);
                  return <Icon className="w-12 h-12 text-muted-foreground/20" />;
                })()}
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Filename</p>
                  <p className="text-sm font-bold text-foreground truncate">{selectedFile.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Size</p>
                    <p className="text-sm font-bold text-foreground">{selectedFile.size}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Added</p>
                    <p className="text-sm font-bold text-foreground">{selectedFile.date}</p>
                  </div>
                </div>
                {selectedFile.dimensions && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Dimensions</p>
                    <p className="text-sm font-bold text-foreground">{selectedFile.dimensions}</p>
                  </div>
                )}
                {selectedFile.duration && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Duration</p>
                    <p className="text-sm font-bold text-foreground">{selectedFile.duration}</p>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-border mt-6 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-foreground rounded-xl text-xs font-bold hover:bg-muted/80 transition-all">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-xs font-bold hover:bg-foreground/90 transition-all">
                  <Info className="w-4 h-4" />
                  Preview
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="glass-panel rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center opacity-50">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-bold text-foreground">No File Selected</p>
              <p className="text-xs text-muted-foreground mt-1">Select a file to view its detailed properties and actions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
