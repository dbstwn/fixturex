
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { getUsers, saveUser, deleteUser } from '../db';
import { Plus, Trash2, Edit3, Save, X, Shield, User as UserIcon } from 'lucide-react';

const DEPARTMENTS = [
    "Department Quality",
    "Department Engineering",
    "Department Production",
    "Others"
];

// Mapping for requested display names
const ROLE_DISPLAY_NAMES: Record<string, string> = {
    [UserRole.God]: 'Administrator',
    [UserRole.Admin]: 'Auditor',
    [UserRole.UserL1]: 'Inspector',
    [UserRole.Viewer]: 'Viewer'
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({
      name: '',
      pin: '',
      role: UserRole.Viewer,
      displayRole: 'Guest',
      department: ''
  });
  
  // States for handling "Others" department
  const [selectedDeptOption, setSelectedDeptOption] = useState('');
  const [customDeptText, setCustomDeptText] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
        const data = await getUsers();
        setUsers(data);
    } catch(e) {
        console.error("Error loading users", e);
    }
  };

  const handleEdit = (user: User) => {
      setEditingUser(user);
      setFormData(user);
      
      const currentDept = user.department || '';
      if (DEPARTMENTS.includes(currentDept) && currentDept !== 'Others') {
          setSelectedDeptOption(currentDept);
          setCustomDeptText('');
      } else if (currentDept) {
          setSelectedDeptOption('Others');
          setCustomDeptText(currentDept);
      } else {
          setSelectedDeptOption('');
          setCustomDeptText('');
      }
      
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(confirm('Are you sure you want to delete this user?')) {
          await deleteUser(id);
          loadUsers();
      }
  };

  const handleAdd = () => {
      setEditingUser(null);
      setFormData({
        name: '',
        pin: '',
        role: UserRole.Viewer,
        displayRole: 'Guest',
        department: ''
      });
      setSelectedDeptOption('');
      setCustomDeptText('');
      setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!formData.name || !formData.pin) return;

      const finalDept = selectedDeptOption === 'Others' ? customDeptText : selectedDeptOption;

      const userToSave: User = {
          id: editingUser ? editingUser.id : Date.now().toString(),
          name: formData.name!,
          pin: formData.pin!,
          role: formData.role as UserRole,
          displayRole: formData.displayRole || 'Guest',
          department: finalDept
      };

      try {
          await saveUser(userToSave);
          setIsModalOpen(false);
          // Reload users to ensure latest state is fetched from DB
          await loadUsers();
      } catch (err) {
          alert('Failed to save user.');
      }
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <UserIcon size={24} />
                    </div>
                    User Management
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add, modify, or remove system access</p>
            </div>
            <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30">
                <Plus size={20} /> Add User
            </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Name</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">PIN</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">System Role</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Display Role</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Department</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="p-4 text-sm font-medium text-gray-800 dark:text-gray-200">{user.name}</td>
                            <td className="p-4 text-sm font-mono text-gray-600 dark:text-gray-400">******</td>
                            <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                    user.role === UserRole.God ? 'bg-purple-100 text-purple-700' :
                                    user.role === UserRole.Admin ? 'bg-blue-100 text-blue-700' :
                                    user.role === UserRole.UserL1 ? 'bg-teal-100 text-teal-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {ROLE_DISPLAY_NAMES[user.role] || user.role}
                                </span>
                            </td>
                            <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{user.displayRole}</td>
                            <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{user.department || '-'}</td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit3 size={16}/></button>
                                    <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                        <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-500" /></button>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Name</label>
                            <input className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PIN (6 Digits)</label>
                            <input className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" maxLength={6} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">System Role</label>
                                <select className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                                    {Object.values(UserRole).map(r => (
                                        <option key={r} value={r}>{ROLE_DISPLAY_NAMES[r] || r}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Display Role</label>
                                <input className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.displayRole} onChange={e => setFormData({...formData, displayRole: e.target.value})} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Department</label>
                            <select 
                                className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white mb-2" 
                                value={selectedDeptOption} 
                                onChange={e => setSelectedDeptOption(e.target.value)}
                            >
                                <option value="">Select Department</option>
                                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            {selectedDeptOption === 'Others' && (
                                <input 
                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-white animate-fade-in" 
                                    placeholder="Enter department name"
                                    value={customDeptText} 
                                    onChange={e => setCustomDeptText(e.target.value)}
                                    required
                                />
                            )}
                        </div>
                        <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition mt-4 flex items-center justify-center gap-2">
                            <Save size={18} /> Save User
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default UserManagement;
