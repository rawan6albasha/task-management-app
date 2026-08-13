import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

/**
 * مكون Table قابل لإعادة الاستخدام
 * @param {Array} data - البيانات المراد عرضها
 * @param {Array} columns - تعريف الأعمدة [{ key, label, render?, sortable?, className }]
 * @param {Function} onRowClick - دالة عند الضغط على الصف
 * @param {Boolean} sortable - هل يدعم الترتيب
 */
export default function Table({ data = [], columns = [], onRowClick, sortable = true }) {
  const [sortConfig, setSortConfig] = useState(null);

  const sortedData = sortConfig
    ? [...data].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return sortConfig.order === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.order === "asc" ? 1 : -1;
        return 0;
      })
    : data;

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, order: prev.order === "asc" ? "desc" : "asc" }
        : { key, order: "asc" }
    );
  };

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-start px-6 py-4 text-sm font-bold text-text ${
                    col.sortable !== false && sortable ? "cursor-pointer hover:bg-background/50" : ""
                  } ${col.className || ""}`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable !== false && sortable && (
                      <span className="text-text-muted">
                        {sortConfig?.key === col.key ? (
                          sortConfig.order === "asc" ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )
                        ) : (
                          <ChevronUp size={16} className="opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="hover:bg-background/50 transition-all duration-200 group cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={`${rowIdx}-${col.key}`}
                    className={`px-6 py-4 text-sm text-text-muted ${col.className || ""}`}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
