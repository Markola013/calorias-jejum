'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Utensils, 
  Coffee, 
  Sun, 
  Moon, 
  Apple, 
  Flame, 
  Scale 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMealLogs, addMealLog, deleteMealLog } from '@/lib/firestore-services';
import { MealLog, MealCategory } from '@/types';
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

// Zod Schema for Meal Ingestion Form
const mealSchema = z.object({
  name: z.string().min(2, 'O nome do alimento deve ter no mínimo 2 caracteres.'),
  category: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  calories: z.number().min(0, 'Mínimo de 0 kcal.'),
  carbs: z.number().min(0, 'Mínimo de 0g.'),
  protein: z.number().min(0, 'Mínimo de 0g.'),
  fat: z.number().min(0, 'Mínimo de 0g.'),
});

type MealFormValues = z.infer<typeof mealSchema>;

export default function MealsPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MealFormValues>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      name: '',
      category: 'breakfast',
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
    },
  });

  const fetchMeals = async (uid: string) => {
    try {
      const logs = await getMealLogs(uid, todayStr);
      setMeals(logs);
    } catch (error) {
      console.error('Error fetching meals:', error);
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
        fetchMeals(user.uid);
      }
    }
  }, [user, userProfile, authLoading, router]);

  const onSubmit = async (data: MealFormValues) => {
    if (!user || submitting) return;
    setSubmitting(true);

    try {
      const newMeal: Omit<MealLog, 'id'> = {
        userId: user.uid,
        name: data.name,
        calories: data.calories,
        carbs: data.carbs,
        protein: data.protein,
        fat: data.fat,
        category: data.category,
        createdAt: new Date().toISOString(),
      };

      await addMealLog(user.uid, newMeal);
      toast.success('Alimento registrado com sucesso!');
      
      // Reset form and close modal
      reset();
      setIsDialogOpen(false);
      
      // Refresh local list
      await fetchMeals(user.uid);
    } catch (error) {
      console.error('Error adding meal:', error);
      toast.error('Erro ao registrar alimento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!user || deletingId) return;
    setDeletingId(mealId);

    try {
      await deleteMealLog(user.uid, mealId);
      toast.success('Alimento removido!');
      
      // Update state local list
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('Erro ao remover alimento.');
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

  // Categories helper details
  const categories: { key: MealCategory; label: string; icon: any; color: string }[] = [
    { key: 'breakfast', label: 'Café da Manhã', icon: Coffee, color: 'text-orange-400' },
    { key: 'lunch', label: 'Almoço', icon: Sun, color: 'text-amber-400' },
    { key: 'dinner', label: 'Jantar', icon: Moon, color: 'text-indigo-400' },
    { key: 'snack', label: 'Lanches / Snacks', icon: Apple, color: 'text-rose-400' },
  ];

  // Daily Totals Calculations
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat, 0);

  // Group meals by category
  const groupedMeals = (catKey: MealCategory) => meals.filter((m) => m.category === catKey);
  const categoryCalories = (catKey: MealCategory) => 
    groupedMeals(catKey).reduce((sum, m) => sum + m.calories, 0);

  return (
    <MobileShell>
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-12">
        
        {/* Header Title with quick add button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Registro de Refeições</h1>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Alimentação de hoje</p>
          </div>

          {/* dialog modal trigger */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-zinc-950 font-bold transition-all duration-300 rounded-xl shadow-lg shadow-orange-500/20"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar
            </Button>
            
            <DialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100 max-w-sm rounded-2xl mx-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-white flex items-center">
                  <Utensils className="h-5 w-5 text-orange-400 mr-2" />
                  Adicionar Alimento
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                {/* Food Name input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Nome do Alimento</label>
                  <Input
                    {...register('name')}
                    placeholder="Ex: Banana de Terra"
                    className="border-zinc-800 bg-zinc-950/70 text-zinc-100 focus-visible:ring-orange-500/50"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>

                {/* Category select radio */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Refeição</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setValue('category', cat.key)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all duration-200 ${
                          watch('category') === cat.key
                            ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                            : 'border-zinc-800 bg-zinc-950/30 text-zinc-500'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calories Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Calorias (kcal)</label>
                  <Input
                    type="number"
                    placeholder="Ex: 120"
                    onChange={(e) => setValue('calories', parseFloat(e.target.value) || 0)}
                    className="border-zinc-800 bg-zinc-950/70 text-zinc-100 focus-visible:ring-orange-500/50"
                  />
                  {errors.calories && <p className="text-xs text-red-500">{errors.calories.message}</p>}
                </div>

                {/* Macronutrients Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block text-center">Carbos (g)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      onChange={(e) => setValue('carbs', parseFloat(e.target.value) || 0)}
                      className="border-zinc-800 bg-zinc-950/70 text-zinc-100 text-center focus-visible:ring-orange-500/50"
                    />
                    {errors.carbs && <p className="text-[10px] text-red-500 text-center">{errors.carbs.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block text-center">Prots (g)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      onChange={(e) => setValue('protein', parseFloat(e.target.value) || 0)}
                      className="border-zinc-800 bg-zinc-950/70 text-zinc-100 text-center focus-visible:ring-orange-500/50"
                    />
                    {errors.protein && <p className="text-[10px] text-red-500 text-center">{errors.protein.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block text-center">Gords (g)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      onChange={(e) => setValue('fat', parseFloat(e.target.value) || 0)}
                      className="border-zinc-800 bg-zinc-950/70 text-zinc-100 text-center focus-visible:ring-orange-500/50"
                    />
                    {errors.fat && <p className="text-[10px] text-red-500 text-center">{errors.fat.message}</p>}
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-zinc-950 font-bold transition-all duration-300 rounded-xl"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      'Salvar Refeição'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* 1. Daily Total Nutrients Summary Card */}
        <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl">
          <CardContent className="py-4">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-orange-400" />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Consumido Hoje</span>
              </div>
              <p className="text-xl font-black text-white">{totalCalories} <span className="text-xs font-normal text-zinc-500">kcal</span></p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
              <div className="p-2 rounded-xl bg-zinc-950/30 border border-zinc-850">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Carboidratos</p>
                <p className="text-zinc-200">{totalCarbs}g</p>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/30 border border-zinc-850">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Proteínas</p>
                <p className="text-zinc-200">{totalProtein}g</p>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950/30 border border-zinc-850">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-0.5">Gorduras</p>
                <p className="text-zinc-200">{totalFat}g</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Categorized Meals Feed */}
        <div className="space-y-4">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const catMeals = groupedMeals(cat.key);
            const catCals = categoryCalories(cat.key);

            return (
              <div key={cat.key} className="space-y-2">
                {/* Category Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <CatIcon className={`h-4 w-4 ${cat.color}`} />
                    <h2 className="text-sm font-bold text-zinc-200">{cat.label}</h2>
                  </div>
                  <span className="text-xs font-bold text-zinc-500 bg-zinc-900 border border-zinc-850 px-2.5 py-0.5 rounded-full">
                    {catCals} kcal
                  </span>
                </div>

                {/* Meals List */}
                <div className="space-y-2">
                  {catMeals.length > 0 ? (
                    catMeals.map((meal) => (
                      <Card key={meal.id} className="border-zinc-800 bg-zinc-900/20 backdrop-blur-sm group hover:border-zinc-700 transition-all duration-300">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-zinc-100">{meal.name}</p>
                            <p className="text-[10px] text-zinc-500 font-medium">
                              C: {meal.carbs}g · P: {meal.protein}g · G: {meal.fat}g
                            </p>
                          </div>

                          <div className="flex items-center space-x-3.5">
                            <span className="text-sm font-black text-white">{meal.calories} kcal</span>
                            
                            <button
                              onClick={() => handleDeleteMeal(meal.id)}
                              disabled={deletingId === meal.id}
                              className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-200"
                              title="Remover alimento"
                            >
                              {deletingId === meal.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-6 border border-dashed border-zinc-850 bg-zinc-950/10 rounded-2xl">
                      <p className="text-xs text-zinc-650 font-medium">Nenhum alimento registrado no {cat.label}.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </MobileShell>
  );
}
