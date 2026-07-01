import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "models/index";
import { authService } from "services/index";
import {
  clearToken,
  getToken,
  setToken,
  setUnauthorizedHandler,
} from "../api/client";

interface SessionContextValue {
  /** Usuario autenticado, o null si no hay sesión. */
  user: User | null;
  /** Token JWT vigente, o null. */
  token: string | null;
  /** true mientras se restaura la sesión al montar. */
  ready: boolean;
  /** Inicia sesión (POST /auth/login). Lanza Error con el mensaje del servidor. */
  login: (email: string, password: string) => Promise<void>;
  /** Fija sesión desde un flujo de auto-login (aceptar invitación). */
  setSession: (token: string, user: User) => void;
  /** Actualiza el usuario en memoria tras editar perfil / avatar. */
  updateUser: (user: User) => void;
  /** Cierra la sesión: limpia el token y el usuario. */
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  // Registra el handler de 401 del cliente HTTP → logout global.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setTokenState(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Arranque: si hay token, restaura la sesión vía /auth/me (401 → logout).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = getToken();
      if (!saved) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const me = await authService.me();
        if (!cancelled) {
          setUser(me);
          setTokenState(saved);
        }
      } catch {
        if (!cancelled) {
          clearToken();
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token: newToken, user: newUser } = await authService.login(
      email,
      password
    );
    setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  }, []);

  const setSession = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
  }, []);

  const updateUser = useCallback((next: User) => {
    setUser(next);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login, setSession, updateUser, logout }),
    [user, token, ready, login, setSession, updateUser, logout]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

/** Hook de acceso a la sesión activa. */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession debe usarse dentro de <SessionProvider>");
  }
  return ctx;
}
