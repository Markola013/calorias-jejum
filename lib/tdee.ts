import { UserProfile } from '@/types';

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

export type ActivityLevelKey = keyof typeof ACTIVITY_MULTIPLIERS;

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor formula
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === 'female') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // average fallback for other genders
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 78;
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE)
 */
export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activityLevel: ActivityLevelKey
): number {
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

export interface TargetResults {
  tdee: number;
  dailyCalorieTarget: number;
  dailyWaterTarget: number;
  macrosRatio: {
    carbs: number;
    protein: number;
    fat: number;
  };
}

/**
 * Automatically determines suggested daily calories, water, and macro targets
 */
export function calculateTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activityLevel: ActivityLevelKey,
  goal: 'lose_weight' | 'maintain_weight' | 'gain_weight'
): TargetResults {
  const tdee = calculateTDEE(weightKg, heightCm, age, gender, activityLevel);
  let dailyCalorieTarget = tdee;
  
  // Custom suggestion of macro distribution percentages based on goal
  let macrosRatio = { carbs: 50, protein: 20, fat: 30 }; // standard balance (50/20/30)

  if (goal === 'lose_weight') {
    // Standard healthy deficit of 500 calories
    dailyCalorieTarget = Math.max(1200, tdee - 500); // 1200 kcal is the safe threshold
    macrosRatio = { carbs: 40, protein: 30, fat: 30 }; // higher protein to preserve lean tissue
  } else if (goal === 'gain_weight') {
    // Moderate surplus of 300 calories for controlled muscle building
    dailyCalorieTarget = tdee + 300;
    macrosRatio = { carbs: 50, protein: 25, fat: 25 }; // adequate protein and carbs for energy/anabolism
  }

  // Water intake formula: 35ml per kg of weight
  const dailyWaterTarget = Math.round(weightKg * 35);

  return {
    tdee,
    dailyCalorieTarget,
    dailyWaterTarget,
    macrosRatio,
  };
}
