import React, { useRef, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import {
  MAX_PHOTO_BYTES,
  validatePhotoFile,
} from "../../utils/validateFuncionarioForm";

/**
 * @param {{
 *   value: File|string|null,
 *   previewUrl?: string|null,
 *   onChange: (file: File|null) => void,
 *   error?: string|null,
 *   onError?: (msg: string|null) => void,
 * }} props
 */
export default function PhotoUploadField({
  value,
  previewUrl = null,
  onChange,
  error = null,
  onError,
}) {
  const inputRef = useRef(null);
  const [localPreview, setLocalPreview] = useState(null);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setLocalPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setLocalPreview(null);
  }, [value]);

  const displaySrc = localPreview || previewUrl || null;

  const openPicker = () => inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const msg = validatePhotoFile(file);
    if (msg) {
      onError?.(msg);
      e.target.value = "";
      return;
    }
    onError?.(null);
    onChange(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange(null);
    onError?.(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="photo-upload" data-field="foto">
      <div className="photo-upload__frame">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="Foto do funcionário"
            className="photo-upload__img"
          />
        ) : (
          <div className="photo-upload__placeholder" aria-hidden="true">
            <i className="bi bi-person-circle" />
          </div>
        )}
        {displaySrc ? (
          <button
            type="button"
            className="photo-upload__remove"
            onClick={handleRemove}
            aria-label="Remover foto"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="photo-upload__actions">
        <Button
          type="button"
          variant="outline-primary"
          size="sm"
          onClick={openPicker}
          aria-label={displaySrc ? "Alterar foto" : "Adicionar foto"}
        >
          <i className="bi bi-camera me-1" aria-hidden="true" />
          {displaySrc ? "Alterar foto" : "Adicionar foto"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          className="d-none"
          onChange={handleChange}
        />
      </div>

      {error ? (
        <p className="photo-upload__error" role="alert">
          {error}
        </p>
      ) : (
        <p className="photo-upload__hint">
          Máx. {(MAX_PHOTO_BYTES / (1024 * 1024)).toFixed(0)}MB · JPG, PNG, GIF
          ou WEBP
        </p>
      )}
    </div>
  );
}
