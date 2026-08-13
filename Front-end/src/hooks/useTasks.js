// useTasks.js
import { useState } from 'react';
export default function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  // دوال وهمية مؤقتاً، ستستبدل بـ RTK Query hooks
  const fetchTasks = async (filters) => { setLoading(true); /* API call */ setLoading(false); };
  return { tasks, loading, fetchTasks };
}
