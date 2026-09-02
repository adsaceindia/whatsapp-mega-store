export interface TeamMember {
  id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  accountAccess: 'Active' | 'Revoked';
  joinedDate: string;
}

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  const res = await fetch('/api/team');
  if (!res.ok) throw new Error('Failed to fetch team members');
  return await res.json();
};

export const addTeamMember = async (member: Omit<TeamMember, 'id'>): Promise<string> => {
  const res = await fetch('/api/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member)
  });
  if (!res.ok) throw new Error('Failed to add team member');
  const data = await res.json();
  return data.id;
};

export const updateTeamMember = async (id: string, member: Partial<TeamMember>): Promise<void> => {
  await fetch('/api/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...member })
  });
};

export const deleteTeamMember = async (id: string): Promise<void> => {
  const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete team member');
};

export const removeTeamMember = deleteTeamMember;
