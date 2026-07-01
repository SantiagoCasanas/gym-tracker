import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "services/index";
import { useSession } from "../context/SessionContext";
import Avatar from "../components/Avatar";
import PhotoInput from "../components/PhotoInput";

/** Opciones de género (select). El backend acepta texto libre. */
const GENDER_OPTIONS = [
  { value: "", label: "Prefiero no decir" },
  { value: "Masculino", label: "Masculino" },
  { value: "Femenino", label: "Femenino" },
  { value: "Otro", label: "Otro" },
];

/** Edición del propio perfil: nombre, edad, género y avatar. */
export default function ProfileEdit() {
  const { user, updateUser } = useSession();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name ?? "");
  const [age, setAge] = useState(user?.age != null ? String(user.age) : "");
  const [gender, setGender] = useState(user?.gender ?? "");
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Escribe tu nombre.");
      return;
    }

    let ageValue: number | null = null;
    if (age.trim() !== "") {
      const parsed = Number(age);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 120) {
        setError("Ingresa una edad válida (0–120).");
        return;
      }
      ageValue = parsed;
    }

    setSaving(true);
    try {
      // 1) Datos de texto.
      let updated = await authService.updateProfile({
        name: trimmed,
        age: ageValue,
        gender: gender.trim() === "" ? null : gender.trim(),
      });
      // 2) Avatar (si se eligió uno nuevo).
      if (avatarBlob) {
        updated = await authService.updateAvatar(avatarBlob);
      }
      updateUser(updated);
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el perfil."
      );
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page__header page__header--nav">
        <button className="back-btn" onClick={() => navigate("/profile")}>
          ‹
        </button>
        <h1>Editar perfil</h1>
      </header>

      <form className="card form" onSubmit={submit}>
        <div className="profile-edit__avatar">
          <Avatar name={name || user?.name} avatarUrl={user?.avatarUrl} size="lg" />
          <PhotoInput onChange={setAvatarBlob} label="Cambiar foto" />
        </div>

        <label className="field">
          <span>Nombre</span>
          <input
            className="input"
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="form__grid-2">
          <label className="field">
            <span>Edad</span>
            <input
              className="input"
              type="number"
              min={0}
              max={120}
              inputMode="numeric"
              placeholder="—"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Género</span>
            <select
              className="input"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="form__error">{error}</p>}

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={saving}
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </form>
    </div>
  );
}
