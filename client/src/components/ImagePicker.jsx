// <ImagePicker value={file} onChange={setFile} error={fieldError} />
// Drag-drop or click; previews the image; rejects non-images and files over 2 MB on the client too.
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX = 2 * 1024 * 1024;

export default function ImagePicker({ value, onChange, id }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!value) return setPreview('');
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const pick = (file) => {
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError('Use a JPG, PNG or WebP image.');
    if (file.size > MAX) return setError('Image must be 2 MB or smaller.');
    setError('');
    onChange(file);
  };

  return (
    <div>
      <div
        className={`imagepicker empty${drag ? ' drag' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
      >
        {preview ? <img src={preview} alt="Selected" /> : (<><Icon name="upload" /><br />Drop an image or click to upload</>)}
      </div>
      <input id={id} ref={inputRef} type="file" accept={TYPES.join(',')} hidden onChange={(e) => pick(e.target.files?.[0])} />
      {value && (
        <button type="button" className="textlink" onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ''; }}>
          Remove photo
        </button>
      )}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
