import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type { Quiz, QuizResult } from '../types/quiz';

// Quizzes

export async function fetchQuizzes(userId: string): Promise<Quiz[]> {
  const snap = await getDocs(collection(db, 'users', userId, 'quizzes'));
  return snap.docs.map((d) => d.data() as Quiz);
}

export async function pushQuiz(userId: string, quiz: Quiz): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'quizzes', quiz.id), quiz);
}

export async function removeQuiz(userId: string, quizId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId, 'quizzes', quizId));
}

// Results

export async function fetchResults(userId: string): Promise<QuizResult[]> {
  const snap = await getDocs(collection(db, 'users', userId, 'results'));
  return snap.docs.map((d) => d.data() as QuizResult);
}

export async function pushResult(userId: string, result: QuizResult): Promise<void> {
  await setDoc(doc(db, 'users', userId, 'results', result.id), result);
}

export async function clearAllResults(userId: string): Promise<void> {
  const snap = await getDocs(collection(db, 'users', userId, 'results'));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export async function deleteResultsForQuiz(userId: string, quizId: string) {
  const snap = await getDocs(collection(db, 'users', userId, 'results'));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    if (d.data().quizId === quizId) batch.delete(d.ref);
  });
  await batch.commit();
}

// Favorites

export async function fetchFavorites(
  userId: string,
): Promise<Record<string, string[]>> {
  const snap = await getDocs(collection(db, 'users', userId, 'favorites'));
  const result: Record<string, string[]> = {};
  snap.docs.forEach((d) => {
    result[d.id] = (d.data().questionIds as string[]) || [];
  });
  return result;
}

export async function pushFavorites(
  userId: string,
  quizId: string,
  questionIds: string[],
): Promise<void> {
  const ref = doc(db, 'users', userId, 'favorites', quizId);
  if (questionIds.length === 0) {
    await deleteDoc(ref);
  } else {
    await setDoc(ref, { questionIds });
  }
}

// Bulk merge

export async function mergeLocalToCloud(
  userId: string,
  quizzes: Quiz[],
  results: QuizResult[],
  favorites: Record<string, string[]>,
): Promise<void> {
  const MAX_OPS_PER_BATCH = 450;

  type BatchOp = { ref: ReturnType<typeof doc>; data: unknown };
  const ops: BatchOp[] = [];

  quizzes.forEach((quiz) => {
    ops.push({ ref: doc(db, 'users', userId, 'quizzes', quiz.id), data: quiz });
  });

  results.forEach((result) => {
    ops.push({ ref: doc(db, 'users', userId, 'results', result.id), data: result });
  });

  Object.entries(favorites).forEach(([quizId, questionIds]) => {
    if (questionIds.length > 0) {
      ops.push({ ref: doc(db, 'users', userId, 'favorites', quizId), data: { questionIds } });
    }
  });

  for (let i = 0; i < ops.length; i += MAX_OPS_PER_BATCH) {
    const chunk = ops.slice(i, i + MAX_OPS_PER_BATCH);
    const batch = writeBatch(db);
    chunk.forEach((op) => batch.set(op.ref, op.data));
    await batch.commit();
  }
}

// Profile

export async function saveProfile(
  userId: string,
  profile: { displayName: string; email: string; photoURL: string; createdAt: string },
): Promise<void> {
  // Store the profile as fields on the user document. A 3-segment path
  // (users/{uid}/profile) is a collection reference and makes setDoc throw
  // "Invalid document reference" — which previously made every merge fail.
  await setDoc(doc(db, 'users', userId), profile, { merge: true });
}
