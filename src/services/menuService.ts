export interface MenuItem {
  id: string;
  title: string;
  url: string;
  type: 'custom' | 'category' | 'page';
}

export interface NavigationMenu {
  id?: string;
  title: string;
  items: MenuItem[];
  location: string;
  active?: boolean;
}

export const getMenus = async (): Promise<NavigationMenu[]> => {
  const res = await fetch('/api/menus');
  if (!res.ok) throw new Error('Failed to fetch menus');
  return await res.json();
};

export const addMenu = async (menu: Omit<NavigationMenu, 'id'>): Promise<string> => {
  const res = await fetch('/api/menus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menu)
  });
  if (!res.ok) throw new Error('Failed to add menu');
  const data = await res.json();
  return data.id;
};

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const menus = await getMenus();
  return menus.length > 0 ? menus[0].items : [];
};

export const saveMenuItems = async (items: MenuItem[]): Promise<void> => {
  const menus = await getMenus();
  if (menus.length > 0) {
    await fetch('/api/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: menus[0].id, title: menus[0].title, items, location: menus[0].location })
    });
  } else {
    await addMenu({ title: 'Main Menu', items, location: 'Header' });
  }
};
