/**
 * Types & Interfaces for Calorie and Fasting Tracker
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  height?: number; // in cm
  weight?: number; // in kg
  age?: number;
  gender?: 'male' | 'female' | 'other';
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  goal?: 'lose_weight' | 'maintain_weight' | 'gain_weight';
  tdee?: number; // Total Daily Energy Expenditure (kcal)
  dailyCalorieTarget?: number; // suggested or custom calorie goal
  dailyWaterTarget?: number; // in ml
  fastingProtocol?: '12:12' | '14:10' | '16:8' | '18:6' | '20:4' | '24' | 'custom';
  customFastingHours?: number; // if fastingProtocol is 'custom'
  targetWeight?: number; // in kg
  macrosRatio?: {
    carbs: number;   // percentage, e.g., 40
    protein: number; // percentage, e.g., 30
    fat: number;     // percentage, e.g., 30
  };
  createdAt: string; // ISO string format
  updatedAt: string; // ISO string format
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealLog {
  id: string;
  userId: string;
  name: string;
  calories: number; // in kcal
  protein: number;  // in grams
  carbs: number;    // in grams
  fat: number;      // in grams
  category: MealCategory;
  createdAt: string; // ISO string format
}

export type FastingStatus = 'active' | 'completed' | 'interrupted';

export interface FastingLog {
  id: string;
  userId: string;
  protocol: string; // e.g., "16:8", "custom"
  startTime: string; // ISO string format
  endTime?: string; // ISO string format
  targetDurationHours: number; // e.g., 16
  actualDurationMinutes?: number; // computed upon completion
  status: FastingStatus;
  notes?: string;
  createdAt: string; // ISO string format
}

export interface WaterLog {
  id: string;
  userId: string;
  amountMl: number; // e.g., 250, 500, 1000
  createdAt: string; // ISO string format
}

export interface WeightLog {
  id: string;
  userId: string;
  weightKg: number;
  createdAt: string; // ISO string format
}

export interface DailyNutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}
