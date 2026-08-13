import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next'; // ✅ إضافة الـ Hook
import { Upload, File, X } from 'lucide-react';

export default function FileUploader({ onChange, maxFiles = 5, maxSizeMB = 5 }) {
  const { t } = useTranslation(); // ✅ تهيئة الترجمة
  const [files, setFiles] = useState([]);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const addFiles = (newFiles) => {
    const valid = newFiles.filter(f => f.size <= maxSizeMB * 1024 * 1024);
    const updated = [...files, ...valid].slice(0, maxFiles);
    setFiles(updated);
    onChange?.(updated);
  };

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-3">
      <div 
        onClick={handleClick}
        onDrop={handleDrop} 
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-background transition cursor-pointer"
      >
        <Upload className="mx-auto h-8 w-8 text-text-muted mb-2" />
        {/* ✅ نص السحب/الاختيار مترجم */}
        <p className="text-sm text-text-muted">{t('fileUploader.dragDropText')}</p>
        {/* ✅ نص الحد الأقصى مترجم مع دعم المتغير */}
        <p className="text-xs text-text-muted/70 mt-1">
          {t('fileUploader.maxSizeText', { size: maxSizeMB })}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => addFiles(Array.from(e.target.files))}
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between bg-background p-2 rounded border border-border">
              <div className="flex items-center gap-2">
                <File size={16} className="text-primary" />
                <span className="text-sm truncate max-w-[200px]">{f.name}</span>
              </div>
              <button onClick={() => removeFile(i)} className="text-danger hover:opacity-80"><X size={16} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}