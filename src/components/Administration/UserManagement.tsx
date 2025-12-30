import React, { useState, useMemo, useEffect } from "react";
import { Edit2, Trash2, UserPlus, Users } from "lucide-react";

type UserStatus = "active" | "inactive";

type User = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  status: UserStatus;
  avatar: string;
  createdAt: string;
};

const initialUsers: User[] = [
  {
    id: 1,
    firstName: "Sandhya",
    lastName: "S",
    username: "sandhya01",
    email: "sandhya@example.com",
    phone: "9876543210",
    role: "Admin",
    status: "active",
    avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140051.png",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    firstName: "Arun",
    lastName: "Kumar",
    username: "arunk",
    email: "arun@example.com",
    phone: "9991234567",
    role: "Business Admin",
    status: "active",
    avatar: "https://cdn-icons-png.flaticon.com/512/2202/2202112.png",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 3,
    firstName: "Divya",
    lastName: "M",
    username: "divyam",
    email: "divya@example.com",
    phone: "9898989898",
    role: "Analyst",
    status: "inactive",
    avatar: "https://cdn-icons-png.flaticon.com/512/4140/4140051.png",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<User>>({});

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | UserStatus>("all");

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      admin: users.filter((u) => u.role.toLowerCase().includes("admin")).length,
    }),
    [users]
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        const matchSearch =
          search === "" ||
          [u.firstName, u.lastName, u.username, u.email].some((field) =>
            field.toLowerCase().includes(search.toLowerCase())
          );
        const matchStatus = filter === "all" ? true : u.status === filter;
        return matchSearch && matchStatus;
      }),
    [users, search, filter]
  );

  const handleSave = () => {
    if (!form.firstName || !form.email) {
      alert("Please fill in required fields");
      return;
    }

    if (editingId) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingId ? { ...u, ...form } as User : u))
      );
    } else {
      const newUser: User = {
        ...(form as User),
        id: Math.max(0, ...users.map((u) => u.id)) + 1,
        avatar:
          form.avatar || "https://cdn-icons-png.flaticon.com/512/4140/4140040.png",
        createdAt: new Date().toISOString(),
        status: (form.status as UserStatus) || "active",
      };
      setUsers([newUser, ...users]);
    }

    setIsModalOpen(false);
    setForm({});
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    if (!window.confirm("Delete this user?")) return;
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-gray-500 text-sm">
            Manage users, roles, and access control
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
        >
          <UserPlus size={18} /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.total} color="blue" />
        <StatCard label="Active Users" value={stats.active} color="green" />
        <StatCard label="Inactive Users" value={stats.inactive} color="blue" />
        <StatCard label="Admin Roles" value={stats.admin} color="green" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <input
          type="text"
          placeholder="Search users..."
          className="border rounded-lg px-3 py-2 w-full sm:w-60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <table className="min-w-full text-sm text-gray-700 dark:text-gray-200">
          <thead>
            <tr className="text-left border-b dark:border-gray-700">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 flex items-center gap-3">
                  <img
                    src={u.avatar}
                    alt={u.firstName}
                    className="w-8 h-8 rounded-full"
                  />
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.phone}</td>
                <td className="px-4 py-3">{u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      u.status === "active"
                        ? "bg-green-100 text-green-600"
                        : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingId(u.id);
                      setForm(u);
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
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
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/60 z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Edit User" : "Create User"}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="First Name"
                className="border px-3 py-2 rounded-lg"
                value={form.firstName || ""}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />
              <input
                placeholder="Last Name"
                className="border px-3 py-2 rounded-lg"
                value={form.lastName || ""}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
              <input
                placeholder="Email"
                className="border px-3 py-2 rounded-lg col-span-2"
                value={form.email || ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                placeholder="Phone"
                className="border px-3 py-2 rounded-lg"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                placeholder="Role"
                className="border px-3 py-2 rounded-lg"
                value={form.role || ""}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
              <select
                className="border px-3 py-2 rounded-lg"
                value={form.status || "active"}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as UserStatus })
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <input
                placeholder="Avatar URL"
                className="border px-3 py-2 rounded-lg col-span-2"
                value={form.avatar || ""}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={handleSave}
              >
                {editingId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🧩 StatCard
const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div
    className={`p-5 rounded-2xl shadow-sm border border-gray-100 bg-${color}-50 text-${color}-600`}
  >
    <div className="text-2xl font-semibold">{value}</div>
    <div className="text-sm font-medium">{label}</div>
  </div>
);

export default UserManagement;
