'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Scale, 
  TrendingDown, 
  TrendingUp, 
  ArrowRight,
  Minus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getWeightLogs, addWeightLog, deleteWeightLog } from '@/lib/firestore-services';
import { WeightLog } from '@/types';
import MobileShell from '@/components/layout/MobileShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const weightSchema = z.object({
  weight: z.number()
    .min(30, 'O peso mínimo é 30 kg.')
    .max(300, 'O peso máximo é 300 kg.'),
});

type WeightFormValues = z.infer<typeof weightSchema>;

export default function WeightPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<WeightFormValues>({
    resolver: zodResolver(weightSchema),
    defaultValues: {
      weight: 70,
    },
  });

  const fetchWeightData = async (uid: string) => {
    try {
      const weightLogs = await getWeightLogs(uid, 50);
      setLogs(weightLogs);
      
      if (weightLogs.length > 0) {
        setValue('weight', weightLogs[0].weightKg);
      } else if (userProfile?.weight) {
        setValue('weight', userProfile.weight);
      }
    } catch (error) {
      console.error('Error fetching weight logs:', error);
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
        fetchWeightData(user.uid);
      }
    }
  }, [user, userProfile, authLoading, router]);

  const onSubmit = async (data: WeightFormValues) => {
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      const nowStr = new Date().toISOString();
      await addWeightLog(user.uid, data.weight, nowStr);
      toast.success('Peso registrado com sucesso!');
      
      reset({ weight: data.weight }); // keeps the logged weight in the input
      await fetchWeightData(user.uid);
      await refreshUserProfile();
    } catch (error) {
      console.error('Error adding weight:', error);
      toast.error('Erro ao registrar peso.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (weightId: string) => {
    if (!user || deletingId) return;
    setDeletingId(weightId);

    try {
      await deleteWeightLog(user.uid, weightId);
      toast.success('Registro de peso removido!');
      setLogs((prev) => prev.filter((l) => l.id !== weightId));
      await refreshUserProfile();
    } catch (error) {
      console.error('Error deleting weight log:', error);
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

  const initialWeight = userProfile?.weight || 70;
  const currentWeight = logs.length > 0 ? logs[0].weightKg : initialWeight;
  const targetWeight = userProfile?.targetWeight || 65;
  const goalType = userProfile?.goal || 'lose_weight';

  const weightDelta = Math.abs(currentWeight - targetWeight);
  const isGoalReached = currentWeight === targetWeight;

  return (
    <MobileShell>
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-12">
        
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Progresso de Peso</h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Controle de peso corporal</p>
          </div>
          <Link href="/analytics">
            <Button size="sm" variant="outline" className="border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-purple-400 border-purple-500/20 font-bold rounded-xl flex items-center">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Gráficos
            </Button>
          </Link>
        </div>

        {/* ======================================================== */}
        {/* 1. PHYSICAL WEIGHT GOAL PROGRESS OVERVIEW */}
        {/* ======================================================== */}
        <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
          <CardContent className="py-4">
            
            <div className="grid grid-cols-3 gap-2 text-center border-b border-zinc-850/60 pb-3.5 mb-3.5">
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Inicial</p>
                <p className="text-base font-extrabold text-zinc-300">{initialWeight} kg</p>
              </div>
              <div className="border-x border-zinc-850/60">
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Atual</p>
                <p className="text-lg font-black text-white">{currentWeight} kg</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Meta Alvo</p>
                <p className="text-base font-extrabold text-emerald-400">{targetWeight} kg</p>
              </div>
            </div>

            {/* Sub-text calculations */}
            <div className="flex items-center justify-center text-xs text-zinc-400 py-1.5 px-3 rounded-xl bg-zinc-950/40 border border-zinc-850">
              {isGoalReached ? (
                <div className="flex items-center text-emerald-400 font-bold space-x-1.5">
                  <Plus className="h-4 w-full rotate-45 shrink-0" />
                  <span>Parabéns! Você alcançou sua meta de peso!</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 text-zinc-300">
                  <TrendingDown className="h-4 w-4 text-purple-400 shrink-0" />
                  <span>
                    Faltam <strong>{weightDelta.toFixed(1)} kg</strong> para atingir sua meta de{' '}
                    {goalType === 'lose_weight' ? 'emagrecimento' : goalType === 'gain_weight' ? 'ganho de peso' : 'manutenção'}.
                  </span>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* 2. LOG WEIGHT ENTRY FORM */}
        {/* ======================================================== */}
        <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
          <CardContent className="py-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3.5 flex items-center">
              <Scale className="h-4 w-4 text-purple-400 mr-2" />
              Novo Registro
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 72.5"
                    {...register('weight', { valueAsNumber: true })}
                    className="border-zinc-800 bg-zinc-950/70 text-zinc-100 text-lg font-black pl-4 focus-visible:ring-purple-500/50"
                  />
                  <span className="absolute right-3.5 top-3 text-xs font-bold text-zinc-500">kg</span>
                </div>
                {errors.weight && <p className="text-xs text-red-500 pl-1">{errors.weight.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold transition-all duration-300 rounded-xl px-5 py-5 shadow-lg shadow-purple-500/10 shrink-0"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Salvar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ======================================================== */}
        {/* 3. HISTORICAL WEIGHT LOGS FEED */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Histórico de Peso</h3>
          
          <div className="space-y-2">
            {logs.length > 0 ? (
              logs.map((log, index) => {
                // Calculate weight variation compared to previous chronological log (which is index + 1 in a descending-ordered list)
                const prevLog = logs[index + 1];
                let variationStr = '';
                let variationColor = 'text-zinc-500';
                let VarIcon = Minus;

                if (prevLog) {
                  const diff = log.weightKg - prevLog.weightKg;
                  const absDiff = Math.abs(diff).toFixed(1);

                  if (diff > 0) {
                    variationStr = `+${absDiff} kg`;
                    VarIcon = TrendingUp;
                    // For weight loss goal, weight gain is red. For weight gain goal, weight gain is green.
                    variationColor = goalType === 'lose_weight' ? 'text-red-500 bg-red-500/5 border-red-500/10' : 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10';
                  } else if (diff < 0) {
                    variationStr = `-${absDiff} kg`;
                    VarIcon = TrendingDown;
                    variationColor = goalType === 'lose_weight' ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' : 'text-red-500 bg-red-500/5 border-red-500/10';
                  } else {
                    variationStr = '0.0 kg';
                    variationColor = 'text-zinc-500 bg-zinc-950/20 border-zinc-850';
                  }
                }

                return (
                  <Card key={log.id} className="border-zinc-850 bg-zinc-900/10 backdrop-blur-sm">
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-base font-black text-white">{log.weightKg} kg</span>
                          
                          {/* Variation indicator */}
                          {prevLog && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center border ${variationColor}`}>
                              <VarIcon className="h-3 w-3 mr-1" />
                              {variationStr}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-[10px] text-zinc-500 font-medium">
                          {format(new Date(log.createdAt), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        disabled={deletingId === log.id}
                        className="text-zinc-650 hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-all duration-200 shrink-0 ml-3"
                        title="Remover registro"
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
                <p className="text-xs text-zinc-600 font-medium">Nenhum registro de peso no histórico.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </MobileShell>
  );
}
