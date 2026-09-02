import React, { useState, useEffect } from 'react';
import { User, Plus, Shield, Trash2, Edit2, Mail, X } from 'lucide-react';
import { getTeamMembers, addTeamMember, removeTeamMember, updateTeamMember, TeamMember } from '../../services/teamService';
import { ConfirmModal } from '../../components/ConfirmModal';

export function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom delete confirmation states
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<TeamMember>>({});
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const data = await getTeamMembers();
      setMembers(data);
    } catch (error) {
      console.error("Error fetching team members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (member?: TeamMember) => {
    if (member) {
      setCurrentMember(member);
      setIsEditing(true);
    } else {
      setCurrentMember({
        name: '', email: '', role: 'Staff', status: 'Pending',
        mobile1: '', mobile2: '', homeContact: '', emergencyContact: '',
        aadharCard: '', drivingLicence: '', currentAddress: '', permanentAddress: '',
        bankAccount: '', ifscCode: '', previousOrg: '', referencePerson: '',
        hobbies: '', education: '', dob: '', maritalStatus: 'Single', childrenCount: 0,
        previousSalary: '', currentSalary: '', designation: '', reportingManager: '',
        hrManager: '', fine: '', remarks: '', dateOfJoining: '', relievingDate: '', accountAccess: 'Granted'
      });
      setIsEditing(false);
    }
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember.name || !currentMember.email) return;
        
    try {
      if (isEditing && currentMember.id) {
        await updateTeamMember(currentMember.id, currentMember as Partial<TeamMember>);
      } else {
        const memberData = {
          ...(currentMember as Omit<TeamMember, 'id'>),
          createdAt: new Date().toISOString()
        };
        await addTeamMember(memberData);
        if (!isEditing) {
          alert(`Invitation sent to ${memberData.email}`);
        }
      }
      setShowModal(false);
      fetchMembers();
    } catch (error) {
      console.error("Error saving member:", error);
      alert("Failed to save member.");
    }
  };

  const handleRemoveClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmRemove = async () => {
    if (!deleteId) return;
    try {
      await removeTeamMember(deleteId);
      fetchMembers();
    } catch (error) {
      console.error("Error removing member:", error);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'contact', label: 'Contact Details' },
    { id: 'personal', label: 'Personal Data' },
    { id: 'hr', label: 'HR & Salary' },
    { id: 'other', label: 'Additional' }
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-500">Manage your store team and organizational hierarchy.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn btn-primary btn-sm"
        >
          <Plus size={20} />
          Invite Member
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        {loading ? (
          <p className="text-gray-500">Loading team members...</p>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No team members yet</h2>
            <p className="text-gray-500 max-w-xl mx-auto mb-6">
              Invite team members to help manage your store and set up your organizational hierarchy.
            </p>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 mx-auto shadow-sm"
            >
              <Plus size={16} />
              Invite Member
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500">
                  <th className="pb-3 font-semibold px-4">Name</th>
                  <th className="pb-3 font-semibold px-4">Role/Designation</th>
                  <th className="pb-3 font-semibold px-4">Hierarchy</th>
                  <th className="pb-3 font-semibold px-4">Status</th>
                  <th className="pb-3 font-semibold px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {members.map(member => (
                  <tr key={member.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <User size={16} />
                        </div>
                        <div>
                          <p>{member.name}</p>
                          <p className="text-xs text-gray-500 font-normal">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      <span className="flex items-center gap-1 font-medium text-gray-900 mb-1">
                        {member.role === 'Admin' ? <Shield size={14} className="text-primary" /> : <User size={14} />}
                        {member.role}
                      </span>
                      {member.designation && <span className="text-xs block">{member.designation}</span>}
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-600">
                      {member.reportingManager && <div className="mb-1"><span className="font-semibold">Reports to:</span> {member.reportingManager}</div>}
                      {member.hrManager && <div><span className="font-semibold">HR:</span> {member.hrManager}</div>}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(member)}
                          className="text-gray-400 hover:text-primary p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleRemoveClick(member.id!)}
                          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{isEditing ? 'Edit Team Member' : 'Invite & Setup Team Member'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex border-b border-gray-100 px-6 overflow-x-auto no-scrollbar">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="member-form" onSubmit={handleSave} className="space-y-4">
                
                {/* Basic Info Tab */}
                <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                      <input type="text" value={currentMember.name || ''} onChange={e => setCurrentMember({...currentMember, name: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
                      <input type="email" value={currentMember.email || ''} onChange={e => setCurrentMember({...currentMember, email: e.target.value})} required className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">System Role</label>
                      <select value={currentMember.role || 'Staff'} onChange={e => setCurrentMember({...currentMember, role: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none">
                        <option value="Admin">Admin</option>
                        <option value="Staff">Staff</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Profile Status</label>
                      <select value={currentMember.status || 'Pending'} onChange={e => setCurrentMember({...currentMember, status: e.target.value as 'Active' | 'Pending'})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none">
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-red-50 p-4 rounded-xl border border-red-100">
                    <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2"><Shield size={18} /> Access & Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-red-800 mb-1">Account Login Access</label>
                        <select value={currentMember.accountAccess || 'Granted'} onChange={e => setCurrentMember({...currentMember, accountAccess: e.target.value as any})} className="w-full border border-red-200 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none bg-white">
                          <option value="Granted">Granted (Can Login)</option>
                          <option value="Revoked">Revoked (Cannot Login)</option>
                        </select>
                        <p className="text-xs text-red-700 mt-1">If revoked, the employee will be immediately locked out.</p>
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={() => alert("A password reset link will be sent to the employee's email.")} className="w-full bg-white border border-red-200 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg font-medium transition-colors">
                          Force Password Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Tab */}
                <div className={activeTab === 'contact' ? 'block' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile No. 1</label>
                      <input type="text" value={currentMember.mobile1 || ''} onChange={e => setCurrentMember({...currentMember, mobile1: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile No. 2</label>
                      <input type="text" value={currentMember.mobile2 || ''} onChange={e => setCurrentMember({...currentMember, mobile2: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Home Contact No.</label>
                      <input type="text" value={currentMember.homeContact || ''} onChange={e => setCurrentMember({...currentMember, homeContact: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Emergency Contact No.</label>
                      <input type="text" value={currentMember.emergencyContact || ''} onChange={e => setCurrentMember({...currentMember, emergencyContact: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Current Address</label>
                      <textarea value={currentMember.currentAddress || ''} onChange={e => setCurrentMember({...currentMember, currentAddress: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" rows={2}></textarea>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Permanent Address</label>
                      <textarea value={currentMember.permanentAddress || ''} onChange={e => setCurrentMember({...currentMember, permanentAddress: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" rows={2}></textarea>
                    </div>
                  </div>
                </div>

                {/* Personal Data Tab */}
                <div className={activeTab === 'personal' ? 'block' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                      <input type="date" value={currentMember.dob || ''} onChange={e => setCurrentMember({...currentMember, dob: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Marital Status</label>
                      <select value={currentMember.maritalStatus || 'Single'} onChange={e => setCurrentMember({...currentMember, maritalStatus: e.target.value as any})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none">
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                    {currentMember.maritalStatus === 'Married' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Children</label>
                        <input type="number" min="0" value={currentMember.childrenCount || 0} onChange={e => setCurrentMember({...currentMember, childrenCount: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Aadhar Card No.</label>
                      <input type="text" value={currentMember.aadharCard || ''} onChange={e => setCurrentMember({...currentMember, aadharCard: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Driving Licence No.</label>
                      <input type="text" value={currentMember.drivingLicence || ''} onChange={e => setCurrentMember({...currentMember, drivingLicence: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Education Qualifications</label>
                      <textarea value={currentMember.education || ''} onChange={e => setCurrentMember({...currentMember, education: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" rows={2} placeholder="E.g. B.Tech, MBA"></textarea>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Hobbies</label>
                      <input type="text" value={currentMember.hobbies || ''} onChange={e => setCurrentMember({...currentMember, hobbies: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                  </div>
                </div>

                {/* HR Tab */}
                <div className={activeTab === 'hr' ? 'block' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-xl mb-2">
                      <h3 className="font-semibold text-gray-900 mb-4">Organizational Hierarchy</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Joining</label>
                          <input type="date" value={currentMember.dateOfJoining || ''} onChange={e => setCurrentMember({...currentMember, dateOfJoining: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Relieving Date</label>
                          <input type="date" value={currentMember.relievingDate || ''} onChange={e => setCurrentMember({...currentMember, relievingDate: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
                          <input type="text" value={currentMember.designation || ''} onChange={e => setCurrentMember({...currentMember, designation: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" placeholder="E.g. Store Manager" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Reporting Manager</label>
                          <input type="text" value={currentMember.reportingManager || ''} onChange={e => setCurrentMember({...currentMember, reportingManager: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">HR Point of Contact</label>
                          <input type="text" value={currentMember.hrManager || ''} onChange={e => setCurrentMember({...currentMember, hrManager: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Current Salary</label>
                      <input type="text" value={currentMember.currentSalary || ''} onChange={e => setCurrentMember({...currentMember, currentSalary: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Previous Salary</label>
                      <input type="text" value={currentMember.previousSalary || ''} onChange={e => setCurrentMember({...currentMember, previousSalary: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Previous Organization</label>
                      <input type="text" value={currentMember.previousOrg || ''} onChange={e => setCurrentMember({...currentMember, previousOrg: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Authorized Person to Contact</label>
                      <input type="text" value={currentMember.referencePerson || ''} onChange={e => setCurrentMember({...currentMember, referencePerson: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                  </div>
                </div>

                {/* Other Tab */}
                <div className={activeTab === 'other' ? 'block' : 'hidden'}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2 bg-blue-50 p-4 rounded-xl mb-2">
                      <h3 className="font-semibold text-blue-900 mb-4">Bank Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-blue-800 mb-1">Bank Account No.</label>
                          <input type="text" value={currentMember.bankAccount || ''} onChange={e => setCurrentMember({...currentMember, bankAccount: e.target.value})} className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-blue-800 mb-1">IFSC Code</label>
                          <input type="text" value={currentMember.ifscCode || ''} onChange={e => setCurrentMember({...currentMember, ifscCode: e.target.value})} className="w-full border border-blue-200 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Fines (If any)</label>
                      <textarea value={currentMember.fine || ''} onChange={e => setCurrentMember({...currentMember, fine: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" rows={2}></textarea>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Remarks</label>
                      <textarea value={currentMember.remarks || ''} onChange={e => setCurrentMember({...currentMember, remarks: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary outline-none" rows={3}></textarea>
                    </div>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="member-form"
                className="btn btn-primary btn-md"
              >
                {isEditing ? <Edit2 size={18} /> : <Mail size={18} />}
                {isEditing ? 'Save Changes' : 'Send Invite & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmRemove}
        title="Remove Team Member"
        message="Are you sure you want to remove this team member? This action is permanent and cannot be undone."
        confirmText="Remove Member"
        type="danger"
      />
    </div>
  );
}
