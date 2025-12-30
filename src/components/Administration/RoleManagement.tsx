import React, { useMemo, useState, useEffect } from "react";
import { FileText, Users, Shield, Settings, Plus, Edit2, Trash2, X } from "lucide-react";

type RoleType = "system" | "custom";

type RoleItem = {
  id: number;
  role: string;
  description: string;
  type: RoleType;
  permissions: string[];
  userCount: number;
  createdAt: string;
  avatar: string;
};

const allPermissions = [
  "user.create", "user.read", "user.update", "user.delete", "role.manage", "tenant.manage", "system.configure",
  "audit.view", "reports.generate", "security.manage", "customer.create", "customer.read", "customer.update",
  "account.manage", "transaction.approve", "team.manage", "reports.branch", "kpi.view", "call.manage",
  "ticket.create", "knowledge.access", "compliance.monitor", "audit.conduct", "risk.assess",
  "report.regulatory", "alert.manage", "analytics.view", "reports.financial", "dashboard.access",
  "data.export", "settings.update", "support.handle", "chat.view"
];

const initialRoles: RoleItem[] = [
  {
    id: 1,
    role: "Admin",
    description: "Full platform access and user management",
    type: "system",
    permissions: ["user.create", "user.read", "user.update", "system.configure", "dashboard.access"],
    userCount: 3,
    createdAt: new Date().toISOString(),
    avatar: "https://cdn-icons-png.flaticon.com/512/2202/2202112.png",
  },
  {
    id: 2,
    role: "Analyst",
    description: "Access to analytics and reporting tools",
    type: "custom",
    permissions: ["analytics.view", "reports.generate", "dashboard.access"],
    userCount: 2,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140040.png",
  },
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | RoleType>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form, setForm] = useState<Partial<RoleItem>>({});
  const [selectAll, setSelectAll] = useState(false);

  const stats = useMemo(() => ({
    total: roles.length,
    systemRoles: roles.filter(r => r.type === "system").length,
    customRoles: roles.filter(r => r.type === "custom").length,
    totalUsers: roles.reduce((s, r) => s + r.userCount, 0),
  }), [roles]);

  const filteredRoles = useMemo(() =>
    roles.filter(r => {
      const matchSearch =
        r.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === "all" ? true : r.type === filterType;
      return matchSearch && matchType;
    }),
    [roles, searchTerm, filterType]
  );

  const openModal = (edit?: RoleItem) => {
    if (edit) {
      setIsEditMode(true);
      setForm(edit);
      setSelectAll(edit.permissions.length === allPermissions.length);
    } else {
      setIsEditMode(false);
      setForm({
        role: "",
        description: "",
        type: "custom",
        permissions: [],
        userCount: 0,
        avatar: "",
      });
      setSelectAll(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.role?.trim()) return alert("Please enter a role name");

    if (isEditMode && form.id) {
      setRoles(prev => prev.map(r => (r.id === form.id ? { ...r, ...form } as RoleItem : r)));
    } else {
      setRoles(prev => [
        { ...(form as RoleItem), id: Date.now(), createdAt: new Date().toISOString() },
        ...prev,
      ]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this role?")) setRoles(prev => prev.filter(r => r.id !== id));
  };

  const togglePermission = (perm: string) => {
    setForm(prev => {
      const perms = prev.permissions || [];
      const newPerms = perms.includes(perm) ? perms.filter(p => p !== perm) : [...perms, perm];
      return { ...prev, permissions: newPerms };
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setForm(prev => ({ ...prev, permissions: [] }));
      setSelectAll(false);
    } else {
      setForm(prev => ({ ...prev, permissions: [...allPermissions] }));
      setSelectAll(true);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Roles & Permissions
          </h1>
          <p className="text-gray-500">Manage system and custom user roles</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition"
        >
          <Plus size={18} /> Create Role
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText />} label="Total Roles" value={stats.total} color="bg-blue-100 text-blue-600" />
        <StatCard icon={<Shield />} label="System Roles" value={stats.systemRoles} color="bg-red-100 text-red-600" />
        <StatCard icon={<Settings />} label="Custom Roles" value={stats.customRoles} color="bg-cyan-100 text-cyan-600" />
        <StatCard icon={<Users />} label="Total Users" value={stats.totalUsers} color="bg-green-100 text-green-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Search roles..."
          className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring focus:ring-primary/30"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select
          className="border border-gray-300 rounded-lg px-4 py-2"
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
        >
          <option value="all">All Roles</option>
          <option value="system">System</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Permissions</th>
              <th className="px-6 py-3 text-center">Users</th>
              <th className="px-6 py-3 text-center">Created</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map(r => (
              <tr key={r.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 flex items-center gap-3">
                  <img src={r.avatar} alt={r.role} className="w-10 h-10 rounded-full" />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{r.role}</div>
                    <div className="text-xs text-gray-500">{r.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${r.type === "system" ? "bg-red-100 text-red-600" : "bg-cyan-100 text-cyan-600"}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                  {r.permissions.slice(0, 3).join(", ")}{r.permissions.length > 3 && `, +${r.permissions.length - 3}`}
                </td>
                <td className="px-6 py-4 text-center">{r.userCount}</td>
                <td className="px-6 py-4 text-center">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => openModal(r)} className="p-2 rounded-md hover:bg-blue-100 text-blue-600">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 rounded-md hover:bg-red-100 text-red-600">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg w-full max-w-2xl p-6 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-4">
              {isEditMode ? "Edit Role" : "Create Role"}
            </h2>

            <div className="space-y-4">
              <input
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Role name"
                value={form.role || ""}
                onChange={e => setForm({ ...form, role: e.target.value })}
              />
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Description"
                value={form.description || ""}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="User count"
                  className="border border-gray-300 rounded-lg px-4 py-2"
                  value={form.userCount || 0}
                  onChange={e => setForm({ ...form, userCount: Number(e.target.value) })}
                />
                <select
                  className="border border-gray-300 rounded-lg px-4 py-2"
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as RoleType })}
                >
                  <option value="system">System</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {/* Permissions */}
              <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-800">Permissions</span>
                  <button
                    className="text-sm text-blue-600 hover:underline"
                    onClick={handleSelectAll}
                  >
                    {selectAll ? "Unselect All" : "Select All"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {allPermissions.map(p => (
                    <label key={p} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.permissions?.includes(p)}
                        onChange={() => togglePermission(p)}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition"
              >
                {isEditMode ? "Update Role" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className={`p-4 rounded-xl ${color} shadow-sm`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/50 rounded-lg">{icon}</div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
    </div>
  );
}
