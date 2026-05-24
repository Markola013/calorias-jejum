'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Droplet, 
  CupSoda, 
  GlassWater, 
  Milk,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getWaterLogs, addWaterLog, deleteWaterLog } from '@/lib/firestore-services';
import { WaterLog } from '@/types';
import MobileShell from '@/components/layout/MobileShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';

export default function WaterPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [customMl, setCustomMl] = useState<number>(350);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const fetchWaterLogs = async (uid: string) => {
    try {
      const todayLogs = await getWaterLogs(uid, todayStr);
      setLogs(todayLogs);
    } catch (error) {
      console.error('Error fetching water logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!userProfile) {
        router.push('/onboarding');
      } else {
        fetchWaterLogs(user.uid);
      }
    }
  }, [user, userProfile, authLoading, router]);

  // Log water intake
  const handleAddWater = async (amount: number) => {
    if (!user || actionLoading) return;
    setActionLoading(true);

    try {
      const nowStr = new Date().toISOString();
      await addWaterLog(user.uid, amount, nowStr);
      toast.success(`+${amount}ml registrados com sucesso!`);
      
      // Close custom modal if open
      setIsDialogOpen(false);

      // Refresh
      await fetchWaterLogs(user.uid);
    } catch (error) {
      console.error('Error logging water:', error);
      toast.error('Erro ao registrar água.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!user || deletingId) return;
    setDeletingId(logId);

    try {
      await deleteWaterLog(user.uid, logId);
      toast.success('Registro removido!');
      setLogs((prev) => prev.filter((l) => l.id !== logId));
    } catch (error) {
      console.error('Error deleting water log:', error);
      toast.error('Erro ao remover registro.');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || (user && !userProfile && loading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-emerald-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const waterTarget = userProfile?.dailyWaterTarget || 2000;
  const totalWater = logs.reduce((sum, w) => sum + w.amountMl, 0);
  const percentComplete = Math.min(100, Math.round((totalWater / waterTarget) * 100));

  return (
    <MobileShell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-12">
        
        {/* Title */}
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Registro de Hidratação</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Ingestão de água diária</p>
        </div>

        {/* ======================================================== */}
        {/* 1. VISUAL VIRTUAL LIQUID CONTAINER */}
        {/* ======================================================== */}
        <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl relative overflow-hidden flex flex-col items-center pt-8 pb-6 px-4">
          
          {/* Visual Cup cylinder */}
          <div className="relative h-48 w-32 border-4 border-zinc-850 rounded-b-3xl rounded-t-xl bg-zinc-950/20 overflow-hidden flex items-center justify-center">
            {/* Animated blue water fill layer */}
            <div 
              className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600/50 to-blue-500/35 transition-all duration-1000 ease-out" 
              style={{ height: `${percentComplete}%` }}
            />
            
            {/* Percentage text */}
            <div className="z-10 text-center select-none">
              <span className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {percentComplete}%
              </span>
              <p className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                meta concluída
              </p>
            </div>
          </div>

          <div className="text-center mt-5 space-y-1">
            <p className="text-2xl font-black text-white tracking-tighter">
              {totalWater} <span className="text-sm font-normal text-zinc-500">ml</span>
            </p>
            <p className="text-[11px] font-bold text-zinc-400">
              Sua meta diária é de <strong>{waterTarget} ml</strong>
            </p>
          </div>

        </Card>

        {/* ======================================================== */}
        {/* 2. QUICK LOGGING BUTTONS */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Adicionar Água</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { amount: 250, label: 'Copo', ml: '250ml', icon: GlassWater },
              { amount: 500, label: 'Garrafa', ml: '500ml', icon: Milk },
              { amount: 1000, label: 'Garrafa G', ml: '1L', icon: CupSoda },
            ].map((btn) => {
              const BtnIcon = btn.icon;

              return (
                <button
                  key={btn.amount}
                  onClick={() => handleAddWater(btn.amount)}
                  disabled={actionLoading}
                  className="py-3 px-2 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:border-blue-500/40 hover:bg-blue-500/5 text-zinc-400 hover:text-blue-400 flex flex-col items-center justify-between transition-all duration-300 group shadow-md"
                >
                  <BtnIcon className="h-6 w-6 mb-1 text-zinc-500 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-300" />
                  <span className="text-xs font-bold text-zinc-200">{btn.label}</span>
                  <span className="text-[10px] opacity-75 mt-0.5 font-semibold text-blue-500">{btn.ml}</span>
                </button>
              );
            })}
          </div>

          {/* Custom ml logger dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="w-full mt-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 text-blue-400 border border-blue-500/20 font-bold transition-all duration-300 rounded-xl"
            >
              Quantidade Personalizada
            </Button>
            
            <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 max-w-sm rounded-2xl mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center">
                  <Droplet className="h-5 w-5 text-blue-400 mr-2" />
                  Quantidade Personalizada
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Insira em ml</label>
                  <Input
                    type="number"
                    value={customMl}
                    onChange={(e) => setCustomMl(parseInt(e.target.value) || 0)}
                    placeholder="Ex: 350"
                    className="border-zinc-800 bg-zinc-950/70 text-zinc-100 focus-visible:ring-blue-500/50 text-center text-lg font-black"
                  />
                </div>
              </div>

              <DialogFooter className="pt-4 flex flex-row items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="w-1/2 border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300"
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => handleAddWater(customMl)}
                  disabled={actionLoading}
                  className="w-1/2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-zinc-950 font-bold"
                >
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>

        {/* ======================================================== */}
        {/* 3. TODAY'S WATER LOGS */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Logs de Hoje</h3>
          
          <div className="space-y-2">
            {logs.length > 0 ? (
              logs.map((log) => (
                <Card key={log.id} className="border-zinc-850 bg-zinc-900/10 backdrop-blur-sm">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Droplet className="h-4.5 w-4.5 fill-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{log.amountMl} ml</p>
                        <p className="text-[10px] text-zinc-500 font-medium">
                          {format(new Date(log.createdAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      disabled={deletingId === log.id}
                      className="text-zinc-650 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200 shrink-0 ml-3"
                      title="Remover água"
                    >
                      {deletingId === log.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 border border-dashed border-zinc-850 bg-zinc-950/10 rounded-2xl">
                <p className="text-xs text-zinc-600 font-medium">Nenhuma água registrada hoje.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </MobileShell>
  );
}
