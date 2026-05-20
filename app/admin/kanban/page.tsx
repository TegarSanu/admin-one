"use client";

import { motion } from "framer-motion";
import { Plus, MoreHorizontal, Calendar, Tag, User, Search, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

type Task = { id: string; title: string; priority: 'High' | 'Medium' | 'Low'; date: string; category: string; columnId: string; order: number };
type Column = { id: string; title: string; tasks: Task[] };

export default function KanbanPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  
  // Ref for tracking the target drop indicator
  const [dropTargetInfo, setDropTargetInfo] = useState<{colId: string, index: number} | null>(null);

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/kanban/columns");
      if (res.ok) {
        const data = await res.json();
        setColumns(data);
      } else {
        toast.error("Failed to load Kanban board");
      }
    } catch (error) {
      toast.error("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const priorityColors = {
    High: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };

  // --- HTML5 Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, task: Task, colId: string) => {
    setDraggedTask(task);
    setDraggedColumnId(colId);
    e.dataTransfer.effectAllowed = "move";
    // Slightly delay hiding the dragged element for better UX
    setTimeout(() => {
      const target = e.target as HTMLElement;
      target.style.opacity = "0.4";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    setDraggedTask(null);
    setDraggedColumnId(null);
    setDropTargetInfo(null);
  };

  const handleDragOver = (e: React.DragEvent, targetColId: string, targetIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTargetInfo?.colId !== targetColId || dropTargetInfo?.index !== targetIndex) {
      setDropTargetInfo({ colId: targetColId, index: targetIndex });
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string, targetIndex: number) => {
    e.preventDefault();
    if (!draggedTask || !draggedColumnId) return;

    // Optimistic UI Update
    const sourceColIndex = columns.findIndex(c => c.id === draggedColumnId);
    const destColIndex = columns.findIndex(c => c.id === targetColId);
    
    if (sourceColIndex === -1 || destColIndex === -1) return;

    const newColumns = [...columns];
    const sourceTasks = [...newColumns[sourceColIndex].tasks];
    const destTasks = sourceColIndex === destColIndex ? sourceTasks : [...newColumns[destColIndex].tasks];

    // Remove from source
    const draggedTaskIndex = sourceTasks.findIndex(t => t.id === draggedTask.id);
    sourceTasks.splice(draggedTaskIndex, 1);

    // Insert into destination
    // Adjust target index if dropping in the same column and below its original position
    let finalTargetIndex = targetIndex;
    if (sourceColIndex === destColIndex && targetIndex > draggedTaskIndex) {
      finalTargetIndex = targetIndex - 1;
    }
    
    const updatedTask = { ...draggedTask, columnId: targetColId };
    destTasks.splice(finalTargetIndex, 0, updatedTask);

    // Re-assign order values
    const updatesToSync: any[] = [];
    destTasks.forEach((t, idx) => {
      t.order = idx;
      updatesToSync.push({ id: t.id, columnId: targetColId, order: idx });
    });
    
    if (sourceColIndex !== destColIndex) {
      sourceTasks.forEach((t, idx) => {
        t.order = idx;
        updatesToSync.push({ id: t.id, columnId: draggedColumnId, order: idx });
      });
      newColumns[sourceColIndex].tasks = sourceTasks;
    }
    
    newColumns[destColIndex].tasks = destTasks;
    setColumns(newColumns);

    // Background API Sync
    try {
      await fetch("/api/admin/kanban/tasks/update-order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: updatesToSync })
      });
    } catch (err) {
      toast.error("Failed to sync board layout");
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Project Board</h1>
          <p className="text-muted-foreground mt-1 font-medium">Manage tasks and project workflows in real-time.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={fetchBoard}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={loading ? "animate-spin w-4 h-4" : "w-4 h-4"} />
          </button>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Filter tasks..." 
              className="pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-foreground/5 transition-all w-48"
            />
          </div>
          <button className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all shadow-lg shadow-foreground/10">
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar min-h-0 items-start">
        {loading && columns.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
             <Loader2 className="w-8 h-8 animate-spin mb-4" />
             <p className="font-bold tracking-widest uppercase text-sm">Loading Board...</p>
          </div>
        ) : columns.map((column) => (
          <div 
            key={column.id} 
            className="w-80 shrink-0 flex flex-col max-h-full"
            onDragOver={(e) => handleDragOver(e, column.id, column.tasks.length)}
            onDrop={(e) => handleDrop(e, column.id, column.tasks.length)}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{column.title}</h3>
                <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">
                  {column.tasks.length}
                </span>
              </div>
              <button className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar p-1 min-h-[150px]">
              {column.tasks.map((task, index) => (
                <div 
                  key={task.id}
                  onDragOver={(e) => handleDragOver(e, column.id, index)}
                  onDrop={(e) => handleDrop(e, column.id, index)}
                  className="relative"
                >
                  {/* Drop Indicator */}
                  {dropTargetInfo?.colId === column.id && dropTargetInfo?.index === index && (
                     <div className="h-1 bg-foreground/20 rounded-full w-full absolute -top-1.5 left-0" />
                  )}

                  <div 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task, column.id)}
                    onDragEnd={handleDragEnd}
                    className="glass-panel p-5 rounded-2xl cursor-grab active:cursor-grabbing border border-border hover:border-foreground/20 transition-all group shadow-sm hover:shadow-lg hover:shadow-foreground/5 bg-card/80"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity">
                        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                    
                    <h4 className="text-sm font-bold text-foreground mb-4 leading-relaxed group-hover:text-foreground transition-colors">{task.title}</h4>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">{task.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">{task.category}</span>
                        </div>
                      </div>
                      
                      <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Bottom Drop Zone (if trailing space) */}
              {dropTargetInfo?.colId === column.id && dropTargetInfo?.index === column.tasks.length && (
                 <div className="h-1 bg-foreground/20 rounded-full w-full my-2" />
              )}
              
              <button className="w-full py-3 border-2 border-dashed border-border rounded-2xl text-muted-foreground hover:text-foreground hover:border-foreground/20 hover:bg-muted/30 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest mt-2">
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
