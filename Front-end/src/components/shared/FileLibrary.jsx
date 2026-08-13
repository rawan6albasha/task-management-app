export default function FileLibrary({ files = [], selected = [], onToggle }) {
  if (!files.length) return <p className="text-sm text-text-muted">لا توجد مرفقات</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {files.map(f => (
        <label key={f.id} className={`relative border rounded-lg p-3 cursor-pointer hover:bg-background transition ${selected.includes(f.id) ? 'border-primary bg-primary/5' : 'border-border'}`}>
        <input 
            type="checkbox" 
            className="absolute top-2 right-2 accent-primary w-4 h-4 cursor-pointer" 
            checked={selected.includes(f.id)} 
            onChange={() => onToggle?.(f.id)} 
          /> <p className="text-sm font-medium truncate mb-1">{f.name}</p>
          <p className="text-xs text-text-muted">{f.type} • {(f.size/1024).toFixed(1)}KB</p>
        </label>
      ))}
    </div>
  );
}