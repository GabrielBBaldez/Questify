import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      navigate('/profile', { replace: true });
    }
  }, [user, loading, navigate]);

  // All hooks must run before any early return (rules of hooks).
  if (loading) return null;

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      if ((err as { code?: string })?.code !== 'auth/popup-closed-by-user') {
        setError('Falha ao fazer login. Tente novamente.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <BookOpen size={32} className={styles.logoIcon} />
          <span>Questify</span>
        </div>

        <p className={styles.subtitle}>
          Sincronize seus dados entre dispositivos
        </p>

        <button className={styles.googleButton} onClick={handleGoogleLogin}>
          <svg className={styles.googleLogo} viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.04 24.04 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Entrar com Google
        </button>

        {error && (
          <p style={{ color: '#e74c3c', marginTop: '0.75rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </p>
        )}

        <Link to="/" className={styles.skipLink}>
          Continuar sem conta
        </Link>

        <p className={styles.info}>
          Ao fazer login, seus quizzes e resultados serão sincronizados
          automaticamente entre todos os seus dispositivos.
        </p>
      </div>
    </div>
  );
}
