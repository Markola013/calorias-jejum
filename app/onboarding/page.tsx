'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowRight, ArrowLeft, Check, Sparkles, Scale, Activity, Flame, Droplet, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createUserProfile } from '@/lib/firestore-services';
import { calculateTargets, ActivityLevelKey } from '@/lib/tdee';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Validation Schema for Onboarding
const onboardingSchema = z.object({
  gender: z.enum(['male', 'female', 'other']),
  age: z.number().min(12, 'A idade mínima é 12 anos.').max(100, 'Idade máxima inválida.'),
  height: z.number().min(100, 'Altura mínima de 100cm.').max(250, 'Altura máxima inválida.'),
  weight: z.number().min(30, 'Peso mínimo de 30kg.').max(300, 'Peso máximo inválido.'),
  activityLevel: z.enum(['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active']),
  goal: z.enum(['lose_weight', 'maintain_weight', 'gain_weight']),
  targetWeight: z.number().min(30, 'Peso mínimo inválido.').max(300, 'Peso máximo inválido.'),
  fastingProtocol: z.enum(['12:12', '14:10', '16:8', '18:6', '20:4', '24', 'custom']),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      gender: 'male',
      age: 25,
      height: 170,
      weight: 70,
      activityLevel: 'moderately_active',
      goal: 'lose_weight',
      targetWeight: 65,
      fastingProtocol: '16:8',
    },
  });

  const selectedGender = watch('gender');
  const selectedActivity = watch('activityLevel');
  const selectedGoal = watch('goal');
  const selectedFasting = watch('fastingProtocol');
  const weightVal = watch('weight');
  const heightVal = watch('height');
  const ageVal = watch('age');

  // Redirect if user is not logged in, or already has a profile
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (userProfile) {
        router.push('/');
      }
    }
  }, [user, userProfile, authLoading, router]);

  // Calculate dynamic results for Step 3 preview
  const [calculatedTargets, setCalculatedTargets] = useState({
    tdee: 2000,
    dailyCalorieTarget: 1500,
    dailyWaterTarget: 2450,
    macrosRatio: { carbs: 40, protein: 30, fat: 30 },
  });

  useEffect(() => {
    if (weightVal && heightVal && ageVal && selectedGender && selectedActivity && selectedGoal) {
      const results = calculateTargets(
        weightVal,
        heightVal,
        ageVal,
        selectedGender,
        selectedActivity as ActivityLevelKey,
        selectedGoal
      );
      setCalculatedTargets(results);
    }
  }, [weightVal, heightVal, ageVal, selectedGender, selectedActivity, selectedGoal]);

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof OnboardingFormValues)[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['gender', 'age', 'height', 'weight'];
    } else if (step === 2) {
      fieldsToValidate = ['activityLevel', 'goal', 'targetWeight'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const onSubmit = async (data: OnboardingFormValues) => {
    if (!user || saving) return;
    setSaving(true);

    try {
      // Calculate final target metrics
      const finalTargets = calculateTargets(
        data.weight,
        data.height,
        data.age,
        data.gender,
        data.activityLevel as ActivityLevelKey,
        data.goal
      );

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || data.gender === 'male' ? 'Usuário' : 'Usuária',
        photoURL: user.photoURL || '',
        height: data.height,
        weight: data.weight,
        age: data.age,
        gender: data.gender,
        activityLevel: data.activityLevel,
        goal: data.goal,
        targetWeight: data.targetWeight,
        tdee: finalTargets.tdee,
        dailyCalorieTarget: finalTargets.dailyCalorieTarget,
        dailyWaterTarget: finalTargets.dailyWaterTarget,
        macrosRatio: finalTargets.macrosRatio,
        fastingProtocol: data.fastingProtocol,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createUserProfile(profile);
      await refreshUserProfile();
      toast.success('Perfil configurado com sucesso! Bem-vindo.');
      router.push('/');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast.error('Erro ao salvar informações de perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-emerald-500">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-zinc-950 px-4 py-8 text-zinc-100 overflow-x-hidden">
      {/* Glow Backdrops */}
      <div className="absolute top-1/4 left-1/4 h-[350px] w-[350px] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-orange-500/5 blur-[130px] pointer-events-none" />

      <Card className="w-full max-w-xl border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-2xl z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">
            Configurar Perfil
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Passo {step} de 3 — {step === 1 ? 'Dados Corporais' : step === 2 ? 'Estilo de Vida' : 'Suas Metas'}
          </CardDescription>

          {/* Simple Step Indicator Lines */}
          <div className="flex justify-center space-x-2 pt-2">
            <div className={`h-1.5 w-10 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
            <div className={`h-1.5 w-10 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
            <div className={`h-1.5 w-10 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit(onSubmit)}>
            
            {/* STEP 1: PERSONAL INFORMATION */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-300">
                {/* Gender Select */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Gênero</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['male', 'female', 'other'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setValue('gender', g as 'male' | 'female' | 'other')}
                        className={`py-3 px-4 rounded-xl border font-medium text-sm transition-all duration-200 capitalize ${
                          selectedGender === g
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                            : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        {g === 'male' ? 'Masculino' : g === 'female' ? 'Feminino' : 'Outro'}
                      </button>
                    ))}
                  </div>
                  {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
                </div>

                {/* Age Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Idade (anos)</label>
                  <Input
                    type="number"
                    placeholder="Ex: 28"
                    onChange={(e) => setValue('age', parseInt(e.target.value) || 0)}
                    className="border-zinc-800 bg-zinc-950/70 text-zinc-100 focus-visible:ring-emerald-500/50"
                  />
                  {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
                </div>

                {/* Height Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Altura (cm)</label>
                  <Input
                    type="number"
                    placeholder="Ex: 175"
                    onChange={(e) => setValue('height', parseInt(e.target.value) || 0)}
                    className="border-zinc-800 bg-zinc-950/70 text-zinc-100 focus-visible:ring-emerald-500/50"
                  />
                  {errors.height && <p className="text-xs text-red-500">{errors.height.message}</p>}
                </div>

                {/* Weight Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Peso Atual (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.4"
                    onChange={(e) => setValue('weight', parseFloat(e.target.value) || 0)}
                    className="border-zinc-800 bg-zinc-950/70 text-zinc-100 focus-visible:ring-emerald-500/50"
                  />
                  {errors.weight && <p className="text-xs text-red-500">{errors.weight.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 2: LIFESTYLE & WEIGHT GOAL */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-300">
                {/* Activity Level Select */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Nível de Atividade</label>
                  <div className="space-y-2">
                    {[
                      { key: 'sedentary', title: 'Sedentário', desc: 'Trabalho de escritório, sem exercícios regulares.' },
                      { key: 'lightly_active', title: 'Exercício Leve', desc: 'Atividades leves de 1 a 3 dias por semana.' },
                      { key: 'moderately_active', title: 'Exercício Moderado', desc: 'Treinos estruturados de 3 a 5 dias por semana.' },
                      { key: 'very_active', title: 'Muito Ativo', desc: 'Treinos intensos de 6 a 7 dias por semana.' },
                      { key: 'extra_active', title: 'Atleta / Trabalho Pesado', desc: 'Treino duplo diário ou trabalho físico exaustivo.' },
                    ].map((act) => (
                      <button
                        key={act.key}
                        type="button"
                        onClick={() => setValue('activityLevel', act.key as any)}
                        className={`w-full text-left py-3 px-4 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                          selectedActivity === act.key
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                            : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm">{act.title}</p>
                          <p className="text-xs opacity-80">{act.desc}</p>
                        </div>
                        {selectedActivity === act.key && <Check className="h-4 w-4 text-emerald-400 shrink-0 ml-3" />}
                      </button>
                    ))}
                  </div>
                  {errors.activityLevel && <p className="text-xs text-red-500">{errors.activityLevel.message}</p>}
                </div>

                {/* Primary Weight Goal */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Objetivo Principal</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'lose_weight', label: 'Emagrecer' },
                      { key: 'maintain_weight', label: 'Manter Peso' },
                      { key: 'gain_weight', label: 'Ganhar Peso' },
                    ].map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setValue('goal', g.key as any)}
                        className={`py-3 px-2 rounded-xl border font-medium text-xs sm:text-sm text-center transition-all duration-200 ${
                          selectedGoal === g.key
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                            : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                  {errors.goal && <p className="text-xs text-red-500">{errors.goal.message}</p>}
                </div>

                {/* Target Weight */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">Peso Alvo (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 68"
                    onChange={(e) => setValue('targetWeight', parseFloat(e.target.value) || 0)}
                    className="border-zinc-800 bg-zinc-950/70 text-zinc-100 focus-visible:ring-emerald-500/50"
                  />
                  {errors.targetWeight && <p className="text-xs text-red-500">{errors.targetWeight.message}</p>}
                </div>
              </div>
            )}

            {/* STEP 3: PREVIEW TARGETS & FASTING PROTOCOL */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-5 duration-300">
                {/* Dynamically computed Targets visual grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 flex flex-col justify-between">
                    <div className="flex items-center text-orange-400 space-x-1.5 mb-1">
                      <Flame className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">TDEE Total</span>
                    </div>
                    <p className="text-2xl font-black text-white">{calculatedTargets.tdee} <span className="text-xs font-normal text-zinc-500">kcal</span></p>
                    <p className="text-[10px] text-zinc-500 mt-1">Gasto de energia estimado diário.</p>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 flex flex-col justify-between">
                    <div className="flex items-center text-emerald-400 space-x-1.5 mb-1">
                      <Scale className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Meta Calórica</span>
                    </div>
                    <p className="text-2xl font-black text-white">{calculatedTargets.dailyCalorieTarget} <span className="text-xs font-normal text-zinc-500">kcal</span></p>
                    <p className="text-[10px] text-emerald-500/80 mt-1 font-medium">
                      {selectedGoal === 'lose_weight' ? 'Déficit calórico de -500 kcal.' : selectedGoal === 'gain_weight' ? 'Superávit calórico de +300 kcal.' : 'Meta ideal para manutenção.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 col-span-2">
                    <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
                      <div className="flex items-center text-zinc-300 space-x-1.5">
                        <Activity className="h-4 w-4 text-emerald-400" />
                        <span>Distribuição de Macronutrientes</span>
                      </div>
                    </div>
                    
                    {/* Carb, Protein, Fat percentage visual bars */}
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-zinc-800">
                      <div className="bg-emerald-500" style={{ width: `${calculatedTargets.macrosRatio.carbs}%` }} title="Carbos" />
                      <div className="bg-orange-500" style={{ width: `${calculatedTargets.macrosRatio.protein}%` }} title="Proteínas" />
                      <div className="bg-blue-500" style={{ width: `${calculatedTargets.macrosRatio.fat}%` }} title="Gorduras" />
                    </div>

                    <div className="flex justify-between text-[11px] font-medium text-zinc-400 mt-2">
                      <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-1.5" />Carbo: {calculatedTargets.macrosRatio.carbs}%</span>
                      <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-orange-500 mr-1.5" />Prot: {calculatedTargets.macrosRatio.protein}%</span>
                      <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-blue-500 mr-1.5" />Gord: {calculatedTargets.macrosRatio.fat}%</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/30 col-span-2 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Droplet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Meta de Água</p>
                        <p className="text-lg font-black text-white">{calculatedTargets.dailyWaterTarget} <span className="text-xs font-normal text-zinc-500">ml</span></p>
                      </div>
                    </div>
                    <span className="text-[10px] text-zinc-500 max-w-[200px] text-right">Média ideal de hidratação baseada no seu peso atual.</span>
                  </div>
                </div>

                {/* Fasting Protocol Select */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">Protocolo de Jejum</label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: '16:8', label: '16h Jejum / 8h Janela' },
                      { key: '18:6', label: '18h Jejum / 6h Janela' },
                      { key: '20:4', label: '20h Jejum / 4h Janela' },
                      { key: '12:12', label: '12h Jejum / 12h Janela' },
                    ].map((prot) => (
                      <button
                        key={prot.key}
                        type="button"
                        onClick={() => setValue('fastingProtocol', prot.key as any)}
                        className={`py-3 px-3 rounded-xl border font-medium text-xs text-left transition-all duration-200 ${
                          selectedFasting === prot.key
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold'
                            : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 text-zinc-400'
                        }`}
                      >
                        {prot.label}
                      </button>
                    ))}
                  </div>
                  {errors.fastingProtocol && <p className="text-xs text-red-500">{errors.fastingProtocol.message}</p>}
                </div>
              </div>
            )}

            {/* CARD ACTION BUTTONS */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-4 border-t border-zinc-800">
              {step > 1 ? (
                <Button
                  type="button"
                  onClick={handlePrevStep}
                  variant="outline"
                  className="border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300 font-semibold transition-all duration-200"
                  disabled={saving}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              ) : (
                <div /> // placeholder for layout alignment
              )}

              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold transition-all duration-200"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-zinc-950 font-bold transition-all duration-300 shadow-lg shadow-emerald-500/20"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gravando...
                    </>
                  ) : (
                    <>
                      Concluir
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
