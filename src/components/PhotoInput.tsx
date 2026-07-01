import { useEffect, useRef, useState } from "react";

interface PhotoInputProps {
  /** Se invoca con el Blob elegido (o null si se limpia). */
  onChange: (blob: Blob | null) => void;
  /** Texto del botón cuando no hay foto. */
  label?: string;
}

/**
 * Captura de foto de máquina. Usa la cámara trasera en móvil
 * (`capture="environment"`), muestra un preview y entrega el Blob al padre.
 * Revoca el objectURL del preview al desmontar / cambiar.
 */
export default function PhotoInput({
  onChange,
  label = "Agregar foto",
}: PhotoInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (!file) {
      setPreviewUrl(null);
      onChange(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onChange(file);
  }

  function clear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="photo-input">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        hidden
      />
      {previewUrl ? (
        <div className="photo-input__preview">
          <img src={previewUrl} alt="Vista previa de la máquina" />
          <div className="photo-input__actions">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => inputRef.current?.click()}
            >
              Cambiar
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm btn--danger"
              onClick={clear}
            >
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn--ghost photo-input__add"
          onClick={() => inputRef.current?.click()}
        >
          {label}
        </button>
      )}
    </div>
  );
}
