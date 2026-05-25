'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { 
  Loader2, 
  BarChart3, 
  TrendingDown, 
  Clock, 
  Zap, 
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getWeightLogs, getMealLogs, getFastingLogs } from '@/lib/firestore-services';
import { WeightLog, MealLog, FastingLog } from '@/types';
import MobileShell from '@/components/layout/MobileShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AnalyticsPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [fasts, setFasts] = useState<FastingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Prevention of SSR/Hydration warnings from Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchAnalyticsData = async (uid: string) => {
    try {
      const wLogs = await getWeightLogs(uid, 10);
      const pastFasts = await getFastingLogs(uid, 30);
      
      // Fetch meal logs for the last 7 days
      // To simplify, we get all meals and filter/group them locally
      const mealLogs = await getMealLogs(uid);

      setWeightLogs(wLogs);
      setFasts(pastFasts);
      setMeals(mealLogs);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
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
        fetchAnalyticsData(user.uid);
      }
    }
  }, [user, userProfile, authLoading, router]);

  if (authLoading || (user && !userProfile && loading) || !mounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-emerald-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const calorieTarget = userProfile?.dailyCalorieTarget || 2000;

  // 1. Prepare Weight Evolution Chart Data (Chronological order)
  const weightChartData = [...weightLogs]
    .reverse()
    .map((log) => ({
      date: format(new Date(log.createdAt), 'dd/MMM', { locale: ptBR }),
      peso: log.weightKg,
    }));

  // 2. Prepare Calorie Bar Chart Data (Last 7 days, including empty days)
  const calorieChartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLabel = format(date, 'eee', { locale: ptBR }).replace('.', '');

    // Sum calories logged on this day
    const dayMeals = meals.filter((m) => m.createdAt.startsWith(dateStr));
    const calories = dayMeals.reduce((sum, m) => sum + m.calories, 0);

    return {
      name: dayLabel,
      Calorias: calories,
    };
  });

  // 3. Fasting Consistency Calculations
  const completedFasts = fasts.filter((f) => f.status === 'completed');
  const totalFasts = fasts.length;
  
  const consistencyRate = totalFasts > 0 
    ? Math.round((completedFasts.length / totalFasts) * 100) 
    : 100;

  const totalFastingMinutes = fasts.reduce((sum, f) => sum + (f.actualDurationMinutes || 0), 0);
  const totalFastingHours = Math.round(totalFastingMinutes / 60);
  
  const avgFastingHours = completedFasts.length > 0
    ? Math.round(completedFasts.reduce((sum, f) => sum + f.targetDurationHours, 0) / completedFasts.length)
    : 16;

  return (
    <MobileShell>
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-12">
        
        {/* Header Navigation link */}
        <div className="flex items-center space-x-2">
          <Link href="/weight">
            <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-zinc-200">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
          </div>
        </div>

        {/* Responsive Grid for Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          
          {/* ======================================================== */}
          {/* 1. WEIGHT EVOLUTION CHART */}
          {/* ======================================================== */}
          <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-zinc-200 flex items-center">
                <TrendingDown className="h-4.5 w-4.5 text-purple-400 mr-2" />
                Evolução de Peso (kg)
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[11px]">
                Variação histórica dos seus últimos 10 registros.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {weightChartData.length > 1 ? (
                <div className="h-48 w-full pr-4 text-xs font-medium">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a/30" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#71717a" 
                        tickLine={false} 
                        axisLine={false} 
                        dy={10} 
                      />
                      <YAxis 
                        stroke="#71717a" 
                        tickLine={false} 
                        axisLine={false} 
                        domain={['dataMin - 1', 'dataMax + 1']} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                        labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                        itemStyle={{ color: '#e4e4e7' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="peso" 
                        stroke="#c084fc" 
                        strokeWidth={3} 
                        activeDot={{ r: 6 }} 
                        dot={{ r: 3, fill: '#c084fc' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-zinc-850 bg-zinc-950/10 rounded-2xl">
                  <p className="text-xs text-zinc-650 font-medium px-4">
                    Registre pelo menos 2 pesagens no histórico para gerar o gráfico de evolução.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/* 2. WEEKLY CALORIES CHART */}
          {/* ======================================================== */}
          <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-zinc-200 flex items-center">
                <BarChart3 className="h-4.5 w-4.5 text-orange-400 mr-2" />
                Calorias nos Últimos 7 Dias
              </CardTitle>
              <CardDescription className="text-zinc-500 text-[11px]">
                Comparativo de ingestão diária vs meta estabelecida.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-48 w-full pr-4 text-xs font-medium">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={calorieChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a/30" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#71717a" 
                      tickLine={false} 
                      axisLine={false} 
                      dy={10} 
                    />
                    <YAxis 
                      stroke="#71717a" 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                      labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                      itemStyle={{ color: '#e4e4e7' }}
                    />
                    <ReferenceLine 
                      y={calorieTarget} 
                      stroke="#ef4444" 
                      strokeDasharray="4 4" 
                      label={{ value: 'Meta', fill: '#f87171', fontSize: 10, position: 'insideTopRight', fontWeight: 'bold' }} 
                    />
                    <Bar 
                      dataKey="Calorias" 
                      fill="#f97316" 
                      radius={[6, 6, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* ======================================================== */}
        {/* 3. INSIGHTS AND CONSISTENCY STATS */}
        {/* ======================================================== */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Insights do Jejum (Últimos 30)</h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Consistency card */}
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
              <CardContent className="p-4 flex flex-col justify-between h-28">
                <div className="flex items-center text-emerald-400 space-x-1.5">
                  <Zap className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Consistência</span>
                </div>
                <p className="text-3xl font-black text-white tracking-tighter">
                  {consistencyRate}%
                </p>
                <p className="text-[9px] text-zinc-500 font-semibold uppercase leading-tight">
                  Jejuns concluídos sem interrupção.
                </p>
              </CardContent>
            </Card>

            {/* Total time card */}
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
              <CardContent className="p-4 flex flex-col justify-between h-28">
                <div className="flex items-center text-blue-400 space-x-1.5">
                  <Clock className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Horas em autofagia</span>
                </div>
                <p className="text-3xl font-black text-white tracking-tighter">
                  {totalFastingHours} <span className="text-xs font-normal text-zinc-500">horas</span>
                </p>
                <p className="text-[9px] text-zinc-500 font-semibold uppercase leading-tight">
                  Média ideal: {avgFastingHours}h por jejum concluído.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </MobileShell>
  );
}
