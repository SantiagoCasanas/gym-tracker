import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SessionProvider, useSession } from "./context/SessionContext";
import BottomNav from "./components/BottomNav";
import AppHeader from "./components/AppHeader";
import Login from "./pages/Login";
import AcceptInvite from "./pages/AcceptInvite";
import Home from "./pages/Home";
import SectionDetail from "./pages/SectionDetail";
import ExerciseDetail from "./pages/ExerciseDetail";
import BodyWeight from "./pages/BodyWeight";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Invitations from "./pages/Invitations";
import Users from "./pages/Users";

/** Layout con barra inferior fija, usado cuando hay sesión activa. */
function AppLayout() {
  return (
    <div className="app-shell app-shell--with-nav">
      <AppHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/section/:sectionId" element={<SectionDetail />} />
        <Route path="/exercise/:exerciseId" element={<ExerciseDetail />} />
        <Route path="/bodyweight" element={<BodyWeight />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/admin/invitations" element={<Invitations />} />
        <Route path="/admin/users" element={<Users />} />
        {/* Cualquier ruta desconocida vuelve a inicio. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

/** Enruta entre rutas públicas (login/accept) y la app protegida. */
function Gate() {
  const { user, ready } = useSession();

  if (!ready) {
    return (
      <div className="app-shell splash">
        <span className="splash__logo">🏋️</span>
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rutas públicas: accesibles siempre. */}
      <Route path="/accept" element={<AcceptInvite />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      {/* Todo lo demás requiere sesión; sin ella → /login. */}
      <Route
        path="*"
        element={user ? <AppLayout /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Gate />
      </SessionProvider>
    </BrowserRouter>
  );
}
