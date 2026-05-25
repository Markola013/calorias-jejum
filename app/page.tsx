'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  Flame, 
  Utensils, 
  Clock, 
  Droplet, 
  Scale, 
  Plus, 
  TrendingDown, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { 
  getMealLogs, 
  getWaterLogs, 
  getActiveFastingLog, 
  getWeightLogs,
  addWaterLog 
} from '@/lib/firestore-services';
import { MealLog, WaterLog, FastingLog, WeightLog } from '@/types';
import MobileShell from '@/components/layout/MobileShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [activeFast, setActiveFast] = useState<FastingLog | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightLog | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [quickWaterLoading, setQuickWaterLoading] = useState(false);
  const [fastingElapsed, setFastingElapsed] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const displayDate = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  // Fetch all dashboard data
  const fetchDashboardData = async (uid: string) => {
    try {
      const fetchedMeals = await getMealLogs(uid, todayStr);
      const fetchedWater = await getWaterLogs(uid, todayStr);
      const fetchedFast = await getActiveFastingLog(uid);
      const fetchedWeight = await getWeightLogs(uid, 1);

      setMeals(fetchedMeals);
      setWaterLogs(fetchedWater);
      setActiveFast(fetchedFast);
      if (fetchedWeight.length > 0) {
        setLatestWeight(fetchedWeight[0]);
      } else {
        setLatestWeight(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (!userProfile) {
        router.push('/onboarding');
      } else {
        fetchDashboardData(user.uid);
      }
    }
  }, [user, userProfile, authLoading, router]);

  // Fasting Elapsed Timer Loop
  useEffect(() => {
    if (!activeFast) return;

    const updateTimer = () => {
      const start = new Date(activeFast.startTime).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;

      if (diffMs <= 0) {
        setFastingElapsed('00:00:00');
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');
      setFastingElapsed(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  // Quick log +250ml water
  const handleQuickWater = async () => {
    if (!user || quickWaterLoading) return;
    setQuickWaterLoading(true);

    try {
      const nowStr = new Date().toISOString();
      await addWaterLog(user.uid, 250, nowStr);
      toast.success('+250ml registrados!');
      
      // Update water local logs
      const updatedWater = await getWaterLogs(user.uid, todayStr);
      setWaterLogs(updatedWater);
    } catch (error) {
      console.error('Error logging quick water:', error);
      toast.error('Erro ao registrar água.');
    } finally {
      setQuickWaterLoading(false);
    }
  };

  if (authLoading || (user && !userProfile && loadingData)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-emerald-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  // EXPLICAÇÃO PARA O PROFESSOR: Valores de metas calóricas e hídricas calculados a partir
  // da equação de Mifflin-St Jeor na etapa de Onboarding. Se o perfil ainda estiver carregando,
  // aplicamos fallbacks preventivos para evitar erros de renderização (Runtime Errors).
  const calorieTarget = userProfile?.dailyCalorieTarget || 2000;
  const waterTarget = userProfile?.dailyWaterTarget || 2000;
  const currentWeight = latestWeight?.weightKg || userProfile?.weight || 70;
  const targetWeight = userProfile?.targetWeight || 65;

  // EXPLICAÇÃO PARA O PROFESSOR: Cálculo de gramas de macronutrientes com base na proporção selecionada (ex: 40/30/30).
  // NOTA DIDÁTICA: 1g de carboidrato = 4 kcal | 1g de proteína = 4 kcal | 1g de gordura = 9 kcal.
  // Multiplicamos a meta calórica total pelo percentual da proporção e dividimos pelas kcal por grama de cada nutriente.
  const macroRatios = userProfile?.macrosRatio || { carbs: 40, protein: 30, fat: 30 };
  const targetCarbs = Math.round((calorieTarget * (macroRatios.carbs / 100)) / 4);
  const targetProtein = Math.round((calorieTarget * (macroRatios.protein / 100)) / 4);
  const targetFat = Math.round((calorieTarget * (macroRatios.fat / 100)) / 9);

  // EXPLICAÇÃO PARA O PROFESSOR: Agregação em tempo real. Fazemos um sumário (reduce) de todos os
  // registros recuperados do banco Firestore para o dia de hoje, somando calorias, macros e água consumida.
  const consumedCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const consumedCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const consumedProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const consumedFat = meals.reduce((sum, m) => sum + m.fat, 0);
  const consumedWater = waterLogs.reduce((sum, w) => sum + w.amountMl, 0);

  const remainingCalories = calorieTarget - consumedCalories;
  const caloriePercentage = Math.min(100, Math.round((consumedCalories / calorieTarget) * 100));

  // EXPLICAÇÃO PARA O PROFESSOR: Geometria analítica do anel SVG de progresso de calorias.
  // 1. Definimos o raio do círculo como 70.
  // 2. Calculamos a circunferência da borda: 2 * PI * Raio = 439.8px.
  // 3. A propriedade 'strokeDasharray' do SVG define o padrão de traços do anel (igual à circunferência).
  // 4. A propriedade 'strokeDashoffset' define onde o traço começa. Para preencher o círculo de acordo
  //    com o progresso calórico, subtraímos a proporção do progresso da circunferência total.
  //    Isso cria a animação de preenchimento fluido e precisa que acompanha as calorias ingeridas!
  const strokeRadius = 70;
  const strokeCircumference = 2 * Math.PI * strokeRadius;
  const strokeDashoffset = strokeCircumference - (caloriePercentage / 100) * strokeCircumference;


  return (
    <MobileShell>
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-8">
        
        {/* Date Display */}
        <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
          {displayDate}
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 items-start">
          
          {/* Main Content Column (2/3 width on desktop) */}
          <div className="space-y-5 md:col-span-2 md:space-y-6">
            
            {/* 1. Main Calorie Visual Ring Card */}
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl relative overflow-hidden">
              <CardContent className="pt-6 flex flex-col items-center">
                
                {/* SVG Progress Ring */}
                <div className="relative h-44 w-44 flex items-center justify-center">
                  <svg className="h-full w-full -rotate-90">
                    {/* Background Ring Track */}
                    <circle
                      className="text-zinc-850 stroke-current"
                      strokeWidth="8"
                      cx="88"
                      cy="88"
                      r={strokeRadius}
                      fill="transparent"
                    />
                    {/* Front Progress Ring */}
                    <circle
                      className="stroke-calorie transition-all duration-500 ease-out"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={strokeCircumference}
                      strokeDashoffset={strokeDashoffset}
                      cx="88"
                      cy="88"
                      r={strokeRadius}
                      fill="transparent"
                    />
                  </svg>

                  {/* Inside Ring Metrics */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                    <Flame className="h-5 w-5 text-calorie animate-pulse mb-0.5" />
                    <span className="text-3.5xl font-black text-white tracking-tighter">
                      {consumedCalories}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                      kcal consumidas
                    </span>
                  </div>
                </div>

                {/* Bottom target details */}
                <div className="w-full grid grid-cols-2 gap-4 border-t border-zinc-800/60 pt-4 mt-2 text-center">
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Meta Diária</p>
                    <p className="text-lg font-bold text-zinc-200">{calorieTarget} kcal</p>
                  </div>
                  <div className="border-l border-zinc-800/60">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Restantes</p>
                    <p className={`text-lg font-extrabold ${remainingCalories >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {remainingCalories} kcal
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* 2. Macronutrients Progress Segment */}
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
              <CardContent className="py-4 space-y-3.5">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center">
                  <Utensils className="h-4 w-4 text-orange-400 mr-2" />
                  Macronutrientes
                </h3>

                {/* Carbs */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-300">Carboidratos</span>
                    <span className="text-zinc-500">
                      <strong className="text-zinc-200">{consumedCarbs}g</strong> / {targetCarbs}g
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-850 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (consumedCarbs / targetCarbs) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Protein */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-300">Proteínas</span>
                    <span className="text-zinc-500">
                      <strong className="text-zinc-200">{consumedProtein}g</strong> / {targetProtein}g
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-850 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (consumedProtein / targetProtein) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Fat */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-zinc-300">Gorduras</span>
                    <span className="text-zinc-500">
                      <strong className="text-zinc-200">{consumedFat}g</strong> / {targetFat}g
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-850 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (consumedFat / targetFat) * 100)}%` }}
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>

          {/* Right Sidebar Widgets Column (1/3 width on desktop) */}
          <div className="space-y-5 md:space-y-6">
            
            {/* 3. Fasting Active Widget */}
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2.5 rounded-xl ${activeFast ? 'bg-emerald-500/10 text-emerald-400 animate-pulse' : 'bg-zinc-800/50 text-zinc-500'}`}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Cronômetro de Jejum</p>
                    {activeFast ? (
                      <p className="text-xl font-black text-white mt-0.5 tracking-tighter">
                        {fastingElapsed || '00:00:00'}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-zinc-500 mt-0.5">Sem jejum ativo no momento</p>
                    )}
                  </div>
                </div>

                <Link href="/fasting">
                  <Button size="icon" variant="ghost" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 4. Interactive Water logging widget */}
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                    <Droplet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Registro de Água</p>
                    <p className="text-xl font-black text-white mt-0.5 tracking-tighter">
                      {consumedWater} <span className="text-xs font-normal text-zinc-500">/ {waterTarget} ml</span>
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleQuickWater}
                  disabled={quickWaterLoading}
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl font-bold flex items-center space-x-1"
                >
                  {quickWaterLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>+250ml</span>
                </Button>
              </CardContent>
            </Card>

            {/* 5. Weight summary card */}
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                      <Scale className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Peso Corporal</p>
                      <p className="text-xl font-black text-white mt-0.5 tracking-tighter">
                        {currentWeight} <span className="text-xs font-normal text-zinc-500">kg</span>
                      </p>
                    </div>
                  </div>

                  <Link href="/weight">
                    <Button size="icon" variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>

                {/* Target comparison calculation */}
                {currentWeight !== targetWeight && (
                  <div className="flex items-center text-xs text-zinc-400 bg-zinc-950/40 border border-zinc-850 rounded-xl px-3 py-2 space-x-2">
                    <TrendingDown className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>
                      Seu peso alvo é de <strong>{targetWeight} kg</strong>.{' '}
                      {currentWeight > targetWeight ? (
                        <>Faltam <strong>{(currentWeight - targetWeight).toFixed(1)} kg</strong> para sua meta.</>
                      ) : (
                        <>Faltam <strong>{(targetWeight - currentWeight).toFixed(1)} kg</strong> para sua meta.</>
                      )}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </MobileShell>
  );
}
