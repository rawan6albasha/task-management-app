import { useState, useEffect } from 'react';
export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  // Mock data simulation
  useEffect(() => {
    const mock = [
      { id: 1, title: "تاسك جديد", content: "تم إسناد مهمة 'تصميم الواجهة' إليك", is_read: false },
      { id: 2, title: "تحديث حالة", content: "تم تغيير حالة المهمة 'رفع الملفات' إلى مكتملة", is_read: true },
    ];
    setNotifications(mock);
    setUnread(mock.filter(n => !n.is_read).length);
  }, []);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  return { notifications, unread, markAsRead };
}