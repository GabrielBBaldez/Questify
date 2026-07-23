import { createContext, useState, useEffect, useRef, type PropsWithChildren } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { auth } from '../firebase';
import { STORAGE_KEYS } from '../constants/storageKeys';
import type { Quiz, QuizResult } from '../types/quiz';
import {
  mergeLocalToCloud,
  saveProfile,
  fetchQuizzes,
  fetchResults,
  fetchFavorites,
  pushQuiz,
  pushResult,
} from '../services/firestoreSync';
import { MergeDialog } from '../components/MergeDialog/MergeDialog';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context + provider colocated by design
export const AuthContext = createContext<AuthContextType | null>(null);

const googleProvider = new GoogleAuthProvider();

function readLocalData() {
  try {
    const quizzes = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]');
    const results = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESULTS) || '[]');
    const favorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '{}');
    return { quizzes, results, favorites };
  } catch {
    return { quizzes: [], results: [], favorites: {} };
  }
}

function buildProfile(firebaseUser: User) {
  return {
    displayName: firebaseUser.displayName || '',
    email: firebaseUser.email || '',
    photoURL: firebaseUser.photoURL || '',
    createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMerge, setShowMerge] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [localCounts, setLocalCounts] = useState({ quizzes: 0, results: 0 });
  const [mergeError, setMergeError] = useState<string | null>(null);
  // Tracks which uid we've already synced this session, so token refreshes
  // (onAuthStateChanged fires again with the same user) don't re-pull and
  // clobber in-session writes.
  const pulledUidRef = useRef<string | null>(null);

  // Merge the cloud snapshot into local storage instead of overwriting it, so
  // an unsynced local write (e.g. a push that failed offline) is preserved and
  // pushed back up rather than silently wiped.
  const pullCloudAndSetUser = async (firebaseUser: User) => {
    const uid = firebaseUser.uid;
    try {
      const [cloudQuizzes, cloudResults, cloudFavorites] = await Promise.all([
        fetchQuizzes(uid),
        fetchResults(uid),
        fetchFavorites(uid),
      ]);
      const local = readLocalData();

      const cloudQuizIds = new Set(cloudQuizzes.map((q: Quiz) => q.id));
      const localOnlyQuizzes = local.quizzes.filter((q: Quiz) => !cloudQuizIds.has(q.id));
      const quizzes = [...cloudQuizzes, ...localOnlyQuizzes];

      const cloudResultIds = new Set(cloudResults.map((r: QuizResult) => r.id));
      const localOnlyResults = local.results.filter((r: QuizResult) => !cloudResultIds.has(r.id));
      const results = [...cloudResults, ...localOnlyResults];

      const favorites = { ...local.favorites, ...cloudFavorites };

      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));

      // Converge devices: push up anything the cloud didn't have yet.
      await Promise.all([
        ...localOnlyQuizzes.map((q: Quiz) => pushQuiz(uid, q)),
        ...localOnlyResults.map((r: QuizResult) => pushResult(uid, r)),
      ]);
      await saveProfile(uid, buildProfile(firebaseUser));
    } catch (err) {
      console.error('Failed to sync cloud data:', err);
      // On network failure, keep existing local data.
    }

    pulledUidRef.current = uid;
    setUser(firebaseUser);
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Already synced this session (token refresh) — don't re-pull.
        if (pulledUidRef.current === firebaseUser.uid) {
          setUser(firebaseUser);
          setLoading(false);
          return;
        }

        const alreadyMerged = localStorage.getItem(STORAGE_KEYS.MERGED) === 'true';
        const { quizzes, results } = readLocalData();
        const hasLocalData = quizzes.length > 0 || results.length > 0;

        if (hasLocalData && !alreadyMerged) {
          setPendingUser(firebaseUser);
          setLocalCounts({ quizzes: quizzes.length, results: results.length });
          setShowMerge(true);
          setLoading(false);
        } else {
          pullCloudAndSetUser(firebaseUser);
        }
      } else {
        pulledUidRef.current = null;
        setUser(null);
        setLoading(false);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once; pullCloudAndSetUser is stable for this purpose
  }, []);

  const handleMerge = async () => {
    if (!pendingUser) return;

    const { quizzes, results, favorites } = readLocalData();
    setMergeError(null);

    try {
      await mergeLocalToCloud(pendingUser.uid, quizzes, results, favorites);
    } catch (err) {
      console.error('Failed to merge local data to cloud:', err);
      setMergeError('Falha ao enviar dados para a nuvem. Tente novamente.');
      return;
    }

    localStorage.setItem(STORAGE_KEYS.MERGED, 'true');
    setShowMerge(false);
    setPendingUser(null);
    // Re-pull so any data already in the cloud (from another device) shows up.
    await pullCloudAndSetUser(pendingUser);
  };

  const handleSkipMerge = async () => {
    if (!pendingUser) return;

    localStorage.setItem(STORAGE_KEYS.MERGED, 'true');
    setShowMerge(false);
    setPendingUser(null);

    await pullCloudAndSetUser(pendingUser);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEYS.MERGED);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
      {showMerge && pendingUser && (
        <MergeDialog
          quizCount={localCounts.quizzes}
          resultCount={localCounts.results}
          onMerge={handleMerge}
          onSkip={handleSkipMerge}
          error={mergeError}
        />
      )}
    </AuthContext.Provider>
  );
}
