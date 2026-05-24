'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  Play, 
  Square, 
  Trash2, 
  Loader2, 
  Clock, 
  Sparkles, 
  Calendar, 
  ChevronRight, 
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { 
  getActiveFastingLog, 
  getFastingLogs, 
  startFasting, 
  endFasting, 
  deleteFastingLog 
} from '@/lib/firestore-services';
import { FastingLog, FastingStatus } from '@/types';
import MobileShell from '@/components/layout/MobileShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function FastingPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null);
  const [history, setHistory] = useState<FastingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Start fast controls
  const [selectedProtocol, setSelectedProtocol] = useState<'12:12' | '14:10' | '16:8' | '18:6' | '20:4' | '24' | 'custom'>('16:8');
  const [customHours, setCustomHours] = useState<number>(16);
  const [startOffsetMinutes, setStartOffsetMinutes] = useState<number>(0); // backdate start time

  // End fast controls
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [endNotes, setEndNotes] = useState('');

  // Live timer states
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [elapsedTimeString, setElapsedTime] = useState('00:00:00');
  const [percentComplete, setPercentComplete] = useState(0);

  const fetchFastingData = async (uid: string) => {
    try {
      const active = await getActiveFastingLog(uid);
      const pastLogs = await getFastingLogs(uid, 15);
      setActiveFast(active);
      setHistory(pastLogs);

      if (active) {
        setSelectedProtocol(active.protocol as any);
      } else if (userProfile?.fastingProtocol) {
        setSelectedProtocol(userProfile.fastingProtocol as any);
      }
    } catch (error) {
      console.error('Error fetching fasting data:', error);
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
        fetchFastingData(user.uid);
      }
    }
  }, [user, userProfile, authLoading, router]);

  // Live countdown update loop
  useEffect(() => {
    if (!activeFast) {
      setElapsedSeconds(0);
      setElapsedTime('00:00:00');
      setPercentComplete(0);
      return;
    }

    const updateTimer = () => {
      const startMs = new Date(activeFast.startTime).getTime();
      const nowMs = new Date().getTime();
      const diffMs = nowMs - startMs;

      if (diffMs <= 0) {
        setElapsedSeconds(0);
        setElapsedTime('00:00:00');
        setPercentComplete(0);
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      setElapsedSeconds(totalSeconds);

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const pad = (num: number) => String(num).padStart(2, '0');
      setElapsedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);

      // Percentage calculation
      const targetSeconds = activeFast.targetDurationHours * 3600;
      const pct = Math.min(100, (totalSeconds / targetSeconds) * 100);
      setPercentComplete(pct);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  // Start Fast Action
  const handleStartFast = async () => {
    if (!user || actionLoading) return;
    setActionLoading(true);

    try {
      const targetHours = selectedProtocol === 'custom' ? customHours : parseInt(selectedProtocol.split(':')[0] || '16');
      
      // Calculate backdated start date if offset is selected
      const startDate = new Date();
      if (startOffsetMinutes > 0) {
        startDate.setMinutes(startDate.getMinutes() - startOffsetMinutes);
      }
      const startTimeISO = startDate.toISOString();

      await startFasting(user.uid, selectedProtocol, startTimeISO, targetHours);
      toast.success('Jejum iniciado! Força de vontade.');
      
      // Refresh
      await fetchFastingData(user.uid);
      setStartOffsetMinutes(0); // Reset offset
    } catch (error) {
      console.error('Error starting fast:', error);
      toast.error('Erro ao iniciar jejum.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open End Fast Confirmation Dialog
  const handleOpenEndDialog = () => {
    if (!activeFast) return;
    setIsEndDialogOpen(true);
  };

  // End Fast Action
  const handleEndFast = async () => {
    if (!user || !activeFast || actionLoading) return;
    setActionLoading(true);
    setIsEndDialogOpen(false);

    try {
      const endTimeISO = new Date().toISOString();
      const startMs = new Date(activeFast.startTime).getTime();
      const endMs = new Date(endTimeISO).getTime();
      const actualMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));
      
      const targetMinutes = activeFast.targetDurationHours * 60;
      const status: FastingStatus = actualMinutes >= targetMinutes ? 'completed' : 'interrupted';

      await endFasting(user.uid, activeFast.id, endTimeISO, actualMinutes, status, endNotes);
      
      if (status === 'completed') {
        toast.success('Jejum concluído com sucesso! Excelente trabalho.');
      } else {
        toast.warning('Jejum interrompido. Todo progresso é válido!');
      }

      setEndNotes(''); // Reset notes
      await fetchFastingData(user.uid);
    } catch (error) {
      console.error('Error ending fast:', error);
      toast.error('Erro ao encerrar jejum.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteLog = async (fastId: string) => {
    if (!user || deletingId) return;
    setDeletingId(fastId);

    try {
      await deleteFastingLog(user.uid, fastId);
      toast.success('Registro removido!');
      setHistory((prev) => prev.filter((h) => h.id !== fastId));
    } catch (error) {
      console.error('Error deleting fasting log:', error);
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

  // Circular SVG ring math: Radius 75, Circumference = 2 * PI * 75 = 471.24
  const strokeRadius = 75;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = strokeCircumference - (percentComplete / 100) * strokeCircumference;

  // Active Fast Protocol Target Details
  const activeFastingTargetHours = activeFast?.targetDurationHours || 16;
  const isFastingCompleted = percentComplete >= 100;

  return (
    <MobileShell>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-12">
        
        {/* Title */}
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Cronômetro de Jejum</h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Acompanhamento em tempo real</p>
        </div>

        {/* ======================================================== */}
        {/* 1. VISUAL COUNTDOWN WHEEL (WHEN FAST ACTIVE) */}
        {/* ======================================================== */}
        {activeFast ? (
          <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl relative overflow-hidden flex flex-col items-center pt-8 pb-6 px-4">
            
            {/* SVG Countdown Ring */}
            <div className="relative h-56 w-56 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                {/* Background Ring Track */}
                <circle
                  className="text-zinc-850 stroke-current"
                  strokeWidth="6"
                  cx="112"
                  cy="112"
                  r={strokeRadius}
                  fill="transparent"
                />
                {/* Glowing Active Ring */}
                <circle
                  className={`transition-all duration-500 ease-out stroke-current ${
                    isFastingCompleted ? 'text-emerald-400' : 'text-emerald-500'
                  }`}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={strokeCircumference}
                  strokeDashoffset={strokeDashoffset}
                  cx="112"
                  cy="112"
                  r={strokeRadius}
                  fill="transparent"
                />
              </svg>

              {/* Inside Countdown wheel details */}
              <div className="absolute text-center flex flex-col justify-center items-center">
                <Clock className={`h-5 w-5 animate-pulse mb-1 ${isFastingCompleted ? 'text-emerald-400' : 'text-emerald-500'}`} />
                <span className="text-3xl font-black text-white tracking-tighter">
                  {elapsedTimeString}
                </span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                  Decorridos ({Math.round(percentComplete)}%)
                </span>
                <span className="text-[11px] font-bold text-zinc-400 mt-2 bg-zinc-950/40 px-3 py-0.5 rounded-full border border-zinc-850">
                  Meta: {activeFastingTargetHours}h
                </span>
              </div>
            </div>

            {/* Início / Fim visual timestamps */}
            <div className="w-full grid grid-cols-2 gap-4 border-t border-zinc-850/60 pt-4 mt-6 text-center text-xs">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Início</p>
                <p className="font-semibold text-zinc-200 mt-0.5">
                  {format(new Date(activeFast.startTime), "HH:mm '({}'eee'{})'", { locale: ptBR })}
                </p>
              </div>
              <div className="border-l border-zinc-850/60">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Término Alvo</p>
                <p className="font-semibold text-zinc-200 mt-0.5">
                  {format(
                    new Date(new Date(activeFast.startTime).getTime() + activeFastingTargetHours * 3600000),
                    "HH:mm '({}'eee'{})'",
                    { locale: ptBR }
                  )}
                </p>
              </div>
            </div>

            {/* End Fast button */}
            <Button
              onClick={handleOpenEndDialog}
              disabled={actionLoading}
              className="w-full mt-6 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold transition-all duration-300 rounded-xl shadow-lg shadow-red-500/10"
            >
              <Square className="h-4 w-4 mr-2" />
              Encerrar Jejum
            </Button>

          </Card>
        ) : (
          /* ======================================================== */
          /* 2. START FAST CONFIG PANEL (WHEN NO FAST ACTIVE) */
          /* ======================================================== */
          <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl pt-6 pb-6 px-4">
            <div className="space-y-5">
              
              <div className="text-center space-y-1">
                <Sparkles className="h-6 w-6 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Pronto para jejuar?</h3>
                <p className="text-xs text-zinc-500">Escolha o seu protocolo ideal abaixo para iniciar.</p>
              </div>

              {/* Grid of fasting protocols */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: '12:12', label: '12h Jejum / 12h Janela', desc: 'Iniciantes' },
                  { key: '14:10', label: '14h Jejum / 10h Janela', desc: 'Moderado' },
                  { key: '16:8', label: '16h Jejum / 8h Janela', desc: 'Padrão Leangains' },
                  { key: '18:6', label: '18h Jejum / 6h Janela', desc: 'Avançado' },
                  { key: '20:4', label: '20h Jejum / 4h Janela', desc: 'Guerreiro (OMAD)' },
                  { key: 'custom', label: 'Protocolo Customizado', desc: 'Ajuste livre' },
                ].map((prot) => (
                  <button
                    key={prot.key}
                    type="button"
                    onClick={() => setSelectedProtocol(prot.key as any)}
                    className={`py-3 px-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 ${
                      selectedProtocol === prot.key
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <span className="text-xs font-bold">{prot.label}</span>
                    <span className="text-[10px] opacity-75 mt-0.5 font-medium">{prot.desc}</span>
                  </button>
                ))}
              </div>

              {/* Custom Hours slider/number input */}
              {selectedProtocol === 'custom' && (
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/30 space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-400">Duração do Jejum</span>
                    <span className="text-emerald-400 font-bold">{customHours} horas</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="72"
                    value={customHours}
                    onChange={(e) => setCustomHours(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Backdating start time picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Quando começou?</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { offset: 0, label: 'Agora mesmo' },
                    { offset: 30, label: '30 min atrás' },
                    { offset: 60, label: '1 hora atrás' },
                  ].map((item) => (
                    <button
                      key={item.offset}
                      type="button"
                      onClick={() => setStartOffsetMinutes(item.offset)}
                      className={`py-2 px-1 rounded-lg border text-[10px] font-bold text-center transition-all duration-200 ${
                        startOffsetMinutes === item.offset
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-zinc-850 bg-zinc-950/30 text-zinc-500'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Fast Action button */}
              <Button
                onClick={handleStartFast}
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-bold transition-all duration-300 rounded-xl shadow-lg shadow-emerald-500/20"
              >
                <Play className="h-4 w-4 mr-2 fill-zinc-950" />
                Iniciar Jejum
              </Button>

            </div>
          </Card>
        )}

        {/* ======================================================== */}
        {/* 3. COMPLETED FASTING HISTORY LOGS */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Histórico Recente</h3>
          
          <div className="space-y-2">
            {history.length > 0 ? (
              history.map((log) => {
                const totalHours = Math.round((log.actualDurationMinutes || 0) / 60);
                const isCompleted = log.status === 'completed';

                return (
                  <Card key={log.id} className="border-zinc-850 bg-zinc-900/10 backdrop-blur-sm">
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-zinc-100">Jejum de {totalHours}h</span>
                          
                          {/* Status Badge */}
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center border ${
                            isCompleted 
                              ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/10' 
                              : 'bg-amber-500/5 text-amber-400 border-amber-500/10'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-2.5 w-2.5 mr-1" />
                            ) : (
                              <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                            )}
                            {isCompleted ? 'Concluído' : 'Interrompido'}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-zinc-500 font-medium">
                          Meta: {log.targetDurationHours}h · {format(new Date(log.startTime), "d 'de' MMM, HH:mm", { locale: ptBR })}
                        </p>
                        
                        {log.notes && (
                          <p className="text-xs text-zinc-400 italic bg-zinc-950/20 border border-zinc-900 rounded-lg px-2 py-1 mt-1.5 max-w-[280px]">
                            "{log.notes}"
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        disabled={deletingId === log.id}
                        className="text-zinc-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200 shrink-0 ml-3"
                        title="Remover jejum"
                      >
                        {deletingId === log.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8 border border-dashed border-zinc-850 bg-zinc-950/10 rounded-2xl">
                <p className="text-xs text-zinc-600 font-medium">Nenhum jejum completado no histórico.</p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. END FAST DIALOG (MODAL FOR LOGGING NOTES) */}
        {/* ======================================================== */}
        <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
          <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 max-w-sm rounded-2xl mx-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white flex items-center">
                <Clock className="h-5 w-5 text-emerald-400 mr-2" />
                Concluir Jejum
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="text-xs text-zinc-400 space-y-1 bg-zinc-950/40 p-3 rounded-xl border border-zinc-850">
                <div className="flex items-center text-emerald-400 font-bold mb-1">
                  <Info className="h-3.5 w-3.5 mr-1" />
                  <span>Cálculo de Duração</span>
                </div>
                {activeFast && (
                  <p>
                    Você jejuou por aproximadamente{' '}
                    <strong>
                      {Math.round((new Date().getTime() - new Date(activeFast.startTime).getTime()) / 60000 / 60)} horas
                    </strong>{' '}
                    desde {format(new Date(activeFast.startTime), "HH:mm 'do dia' d", { locale: ptBR })}.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Notas (Como você se sentiu?)</label>
                <Input
                  value={endNotes}
                  onChange={(e) => setEndNotes(e.target.value)}
                  placeholder="Ex: Me senti ativo, sem fome no final!"
                  className="border-zinc-800 bg-zinc-950/70 text-zinc-100 focus-visible:ring-emerald-500/50"
                />
              </div>
            </div>

            <DialogFooter className="pt-4 flex flex-row items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEndDialogOpen(false)}
                className="w-1/2 border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300"
              >
                Voltar
              </Button>
              <Button
                type="button"
                onClick={handleEndFast}
                className="w-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-bold"
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </MobileShell>
  );
}
