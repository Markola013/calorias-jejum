import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, MealLog, FastingLog, WaterLog, WeightLog } from '@/types';

// ==========================================
// 1. User Profile Services
// ==========================================

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const docRef = doc(db, 'users', profile.uid);
  await setDoc(docRef, profile);
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

// ==========================================
// 2. Meal Log Services
// ==========================================

export async function addMealLog(userId: string, meal: Omit<MealLog, 'id'>): Promise<string> {
  const colRef = collection(db, 'users', userId, 'meals');
  const docRef = await addDoc(colRef, meal);
  // Update the document to include the auto-generated Firestore ID
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function getMealLogs(userId: string, dateStr?: string): Promise<MealLog[]> {
  const colRef = collection(db, 'users', userId, 'meals');
  let q = query(colRef, orderBy('createdAt', 'desc'));

  if (dateStr) {
    // E.g., dateStr is "2026-05-24"
    const startOfDay = new Date(`${dateStr}T00:00:00`).toISOString();
    const endOfDay = new Date(`${dateStr}T23:59:59.999`).toISOString();
    q = query(
      colRef,
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay),
      orderBy('createdAt', 'desc')
    );
  }

  const querySnapshot = await getDocs(q);
  const logs: MealLog[] = [];
  querySnapshot.forEach((doc) => {
    logs.push(doc.data() as MealLog);
  });
  return logs;
}

export async function deleteMealLog(userId: string, mealId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'meals', mealId);
  await deleteDoc(docRef);
}

// ==========================================
// 3. Fasting Log Services
// ==========================================

export async function startFasting(
  userId: string,
  protocol: string,
  startTime: string,
  targetDurationHours: number
): Promise<string> {
  const colRef = collection(db, 'users', userId, 'fasts');
  const newFast: Omit<FastingLog, 'id'> = {
    userId,
    protocol,
    startTime,
    targetDurationHours,
    status: 'active',
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(colRef, newFast);
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function endFasting(
  userId: string,
  fastId: string,
  endTime: string,
  actualDurationMinutes: number,
  status: 'completed' | 'interrupted',
  notes?: string
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'fasts', fastId);
  await updateDoc(docRef, {
    endTime,
    actualDurationMinutes,
    status,
    notes: notes || '',
  });
}

// EXPLICAÇÃO PARA O PROFESSOR: Busca o registro de jejum ativo ('active') do usuário logado.
// NOTA DIDÁTICA: O Firestore exige a criação manual de Índices Compostos no painel da nuvem se
// usarmos filtros 'where' e ordenações 'orderBy' em campos diferentes. Como cada usuário só pode
// ter no máximo um único jejum ativo ao mesmo tempo, removemos a ordenação por 'createdAt' e mantivemos
// apenas o filtro de status e um limite de 1 registro. Isso faz com que a consulta funcione de forma
// instantânea e automática em qualquer base Firestore sem exigir configuração manual de índices!
export async function getActiveFastingLog(userId: string): Promise<FastingLog | null> {
  const colRef = collection(db, 'users', userId, 'fasts');
  const q = query(
    colRef,
    where('status', '==', 'active'),
    limit(1)
  );
  
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as FastingLog;
  }
  return null;
}


export async function getFastingLogs(userId: string, limitCount = 50): Promise<FastingLog[]> {
  const colRef = collection(db, 'users', userId, 'fasts');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  const logs: FastingLog[] = [];
  querySnapshot.forEach((doc) => {
    logs.push(doc.data() as FastingLog);
  });
  return logs;
}

export async function deleteFastingLog(userId: string, fastId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'fasts', fastId);
  await deleteDoc(docRef);
}

// ==========================================
// 4. Water Log Services
// ==========================================

export async function addWaterLog(userId: string, amountMl: number, createdAt: string): Promise<string> {
  const colRef = collection(db, 'users', userId, 'water');
  const newWater: Omit<WaterLog, 'id'> = {
    userId,
    amountMl,
    createdAt
  };
  const docRef = await addDoc(colRef, newWater);
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function getWaterLogs(userId: string, dateStr?: string): Promise<WaterLog[]> {
  const colRef = collection(db, 'users', userId, 'water');
  let q = query(colRef, orderBy('createdAt', 'desc'));

  if (dateStr) {
    const startOfDay = new Date(`${dateStr}T00:00:00`).toISOString();
    const endOfDay = new Date(`${dateStr}T23:59:59.999`).toISOString();
    q = query(
      colRef,
      where('createdAt', '>=', startOfDay),
      where('createdAt', '<=', endOfDay),
      orderBy('createdAt', 'desc')
    );
  }

  const querySnapshot = await getDocs(q);
  const logs: WaterLog[] = [];
  querySnapshot.forEach((doc) => {
    logs.push(doc.data() as WaterLog);
  });
  return logs;
}

export async function deleteWaterLog(userId: string, waterId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'water', waterId);
  await deleteDoc(docRef);
}

// ==========================================
// 5. Weight Log Services
// ==========================================

export async function addWeightLog(userId: string, weightKg: number, createdAt: string): Promise<string> {
  const colRef = collection(db, 'users', userId, 'weight');
  const newWeight: Omit<WeightLog, 'id'> = {
    userId,
    weightKg,
    createdAt
  };
  const docRef = await addDoc(colRef, newWeight);
  await updateDoc(docRef, { id: docRef.id });
  return docRef.id;
}

export async function getWeightLogs(userId: string, limitCount = 100): Promise<WeightLog[]> {
  const colRef = collection(db, 'users', userId, 'weight');
  const q = query(colRef, orderBy('createdAt', 'desc'), limit(limitCount));
  const querySnapshot = await getDocs(q);
  const logs: WeightLog[] = [];
  querySnapshot.forEach((doc) => {
    logs.push(doc.data() as WeightLog);
  });
  return logs;
}

export async function deleteWeightLog(userId: string, weightId: string): Promise<void> {
  const docRef = doc(db, 'users', userId, 'weight', weightId);
  await deleteDoc(docRef);
}
