import { useState, useEffect } from 'react';

export function useUserRole() {
  const [role, setRole] = useState<'Admin' | 'Staff'>('Admin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedRole = localStorage.getItem('user_role');
    if (cachedRole === 'Admin' || cachedRole === 'Staff') {
      setRole(cachedRole);
    } else {
      const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
      if (isLoggedIn) {
        setRole('Admin');
        localStorage.setItem('user_role', 'Admin');
      }
    }
    setLoading(false);
  }, []);

  const isAdmin = role === 'Admin';
  const isStaff = role === 'Staff';

  return { role, isAdmin, isStaff, loading };
}
