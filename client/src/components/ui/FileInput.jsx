import { forwardRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import { FileText, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MAX_UPLOAD_SIZE } from '@/lib/constants';
import { formatBytes } from '@/lib/formData';
import { describedBy } from './fieldStyles';

/**
 * Controlled file picker with drag & drop and a selected-file chip. The ref is forwarded to the native
 * input so react-hook-form can focus it on error. Use with react-hook-form `Controller`:
 * `<Controller name="resume" control={control} render={({ field }) => <FileInput {...field} ... />} />`
 *
 * @param {File|null} value selected file
 * @param {(file: File|null) => void} onChange
 * @param {string} [accept] input accept attribute (see `FILE_TYPES` in lib/constants)
 * @param {string} [description] human label of allowed types, e.g. "PDF"
 * @param {number} [maxSize] bytes, shown in the helper text
 * @param {{ filename: string, size?: number }} [existingFile] currently stored file (edit forms)
 */
const FileInput = forwardRef(function FileInput(
  {
    id,
    name,
    value,
    onChange,
    onBlur,
    accept,
    description,
    maxSize = MAX_UPLOAD_SIZE,
    existingFile,
    error,
    hasHint,
    disabled = false,
    className,
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef(null);
  const setInputRef = useCallback(
    (node) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const [dragging, setDragging] = useState(false);

  // Keep the native input in sync when the form clears the value (so the same file can be re-selected).
  useEffect(() => {
    if (!value && inputRef.current) inputRef.current.value = '';
  }, [value]);

  const selectFile = (file) => {
    onChange?.(file ?? null);
    onBlur?.();
  };

  const clear = () => selectFile(null);

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  const shownFile = value instanceof File ? { filename: value.name, size: value.size, isNew: true } : existingFile;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors',
          'focus-within:ring-2 focus-within:ring-primary-500/30',
          dragging ? 'border-primary-400 bg-primary-50' : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50',
          error && 'border-rose-400 bg-rose-50/40',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <UploadCloud aria-hidden="true" className="h-6 w-6 text-primary-500" />
        <span className="text-sm text-slate-700">
          <span className="font-semibold text-primary-600">Click to upload</span>
          <span className="hidden sm:inline"> or drag and drop</span>
        </span>
        <span className="text-xs text-slate-500">
          {description ? `${description} up to ${formatBytes(maxSize)}` : `Max ${formatBytes(maxSize)}`}
        </span>
        <input
          ref={setInputRef}
          id={inputId}
          name={name}
          type="file"
          accept={accept}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, { error, hint: hasHint })}
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
      </label>

      {shownFile && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <FileText aria-hidden="true" className="h-5 w-5 shrink-0 text-primary-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800" title={shownFile.filename}>
              {shownFile.filename}
            </p>
            <p className="text-xs text-slate-500">
              {shownFile.size ? formatBytes(shownFile.size) : null}
              {shownFile.isNew ? (existingFile ? ' · will replace current file' : ' · ready to upload') : ' · current file'}
            </p>
          </div>
          {shownFile.isNew && !disabled && (
            <button
              type="button"
              onClick={clear}
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              aria-label={`Remove ${shownFile.filename}`}
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

export default FileInput;
