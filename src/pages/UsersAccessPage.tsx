import { useEffect, useMemo, useState } from "react";
import { LockKeyhole, RefreshCcw, ShieldCheck, UserPlus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { AdminUser, AdminUserPayload, AdminUserPermissions, ModuleAccess, UserRole } from "@/types";

const roleOptions: UserRole[] = ["AD", "TE", "VE", "FE"];
const moduleKeys = ["users", "structures", "reports", "admin"] as const;
const legacyPermissionKeys = [
  "can_create_structures",
  "can_approve_structures",
  "can_delete_structures",
  "can_view_all_structures",
  "can_export_reports",
  "can_manage_users"
] as const;

function createModuleAccess(read = false, write = false): ModuleAccess {
  return { read, write };
}

function buildDefaultPermissions(role: UserRole = "FE"): AdminUserPermissions {
  const normalizedRole = String(role).toUpperCase();

  if (normalizedRole === "AD") {
    return {
      can_create_structures: true,
      can_approve_structures: true,
      can_delete_structures: true,
      can_view_all_structures: true,
      can_export_reports: true,
      can_manage_users: true,
      modules: {
        users: createModuleAccess(true, true),
        structures: createModuleAccess(true, true),
        reports: createModuleAccess(true, true),
        admin: createModuleAccess(true, true)
      }
    };
  }

  if (normalizedRole === "VE" || normalizedRole === "TE") {
    return {
      can_create_structures: true,
      can_approve_structures: normalizedRole === "VE",
      can_delete_structures: false,
      can_view_all_structures: true,
      can_export_reports: true,
      can_manage_users: false,
      modules: {
        users: createModuleAccess(false, false),
        structures: createModuleAccess(true, true),
        reports: createModuleAccess(true, true),
        admin: createModuleAccess(true, false)
      }
    };
  }

  return {
    can_create_structures: true,
    can_approve_structures: false,
    can_delete_structures: false,
    can_view_all_structures: false,
    can_export_reports: true,
    can_manage_users: false,
    modules: {
      users: createModuleAccess(false, false),
      structures: createModuleAccess(true, true),
      reports: createModuleAccess(true, true),
      admin: createModuleAccess(false, false)
    }
  };
}

function buildEmptyUserForm(): AdminUserPayload {
  return {
    username: "",
    email: "",
    role: "FE",
    roles: ["FE"],
    is_active: true,
    isEmailVerified: true,
    profile: {
      first_name: "",
      last_name: "",
      designation: "",
      organization: ""
    },
    permissions: buildDefaultPermissions("FE")
  };
}

function toFormState(user: AdminUser): AdminUserPayload {
  return {
    username: user.username,
    email: user.email,
    role: user.role,
    roles: user.roles?.length ? user.roles : [user.role],
    is_active: user.is_active ?? true,
    isEmailVerified: user.isEmailVerified ?? true,
    profile: {
      first_name: user.profile?.first_name || "",
      last_name: user.profile?.last_name || "",
      designation: user.profile?.designation || "",
      organization: user.profile?.organization || ""
    },
    permissions: {
      ...buildDefaultPermissions(user.role),
      ...user.permissions,
      modules: {
        ...buildDefaultPermissions(user.role).modules,
        ...user.permissions?.modules
      }
    }
  };
}

export function UsersAccessPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [form, setForm] = useState<AdminUserPayload>(buildEmptyUserForm);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const selectedUser = useMemo(
    () => users.find((item) => item._id === selectedUserId) || null,
    [selectedUserId, users]
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;

    return users.filter((user) =>
      [user.username, user.email, user.role, user.profile?.designation]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    );
  }, [query, users]);

  useEffect(() => {
    void loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const response = await api.getAdminUsers();
      const nextUsers = response.data || [];
      setUsers(nextUsers);
      if (selectedUserId) {
        const refreshedSelectedUser = nextUsers.find((item) => item._id === selectedUserId);
        if (refreshedSelectedUser) {
          setForm(toFormState(refreshedSelectedUser));
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNew() {
    setSelectedUserId("");
    setTemporaryPassword("");
    setMessage("");
    setForm(buildEmptyUserForm());
  }

  function handleSelectUser(user: AdminUser) {
    setSelectedUserId(user._id);
    setTemporaryPassword("");
    setMessage("");
    setForm(toFormState(user));
  }

  function updateField<K extends keyof AdminUserPayload>(key: K, value: AdminUserPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateProfileField(key: "first_name" | "last_name" | "designation" | "organization", value: string) {
    setForm((current) => ({
      ...current,
      profile: {
        ...current.profile,
        [key]: value
      }
    }));
  }

  function updateLegacyPermission(key: typeof legacyPermissionKeys[number], checked: boolean) {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        [key]: checked
      }
    }));
  }

  function updateModulePermission(moduleKey: typeof moduleKeys[number], accessKey: keyof ModuleAccess, checked: boolean) {
    setForm((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        modules: {
          ...current.permissions.modules,
          [moduleKey]: {
            ...current.permissions.modules[moduleKey],
            [accessKey]: checked
          }
        }
      }
    }));
  }

  function handleRoleChange(nextRole: string) {
    const role = nextRole.toUpperCase();
    const defaults = buildDefaultPermissions(role);
    setForm((current) => ({
      ...current,
      role,
      roles: [role],
      permissions: {
        ...defaults,
        ...current.permissions,
        modules: defaults.modules
      }
    }));
  }

  async function handleSubmit() {
    try {
      setSaving(true);
      setError("");
      setMessage("");
      setTemporaryPassword("");

      if (selectedUserId) {
        const response = await api.updateAdminUser(selectedUserId, form);
        setMessage(response.message || "User updated successfully");
      } else {
        const response = await api.createAdminUser(form);
        setMessage(response.message || "User created successfully");
        setTemporaryPassword(response.data?.temporary_password || "");
        if (response.data?._id) {
          setSelectedUserId(response.data._id);
        }
      }

      await loadUsers();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!selectedUserId) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");
      const response = await api.resetAdminUserPassword(selectedUserId);
      setTemporaryPassword(response.data?.temporary_password || "");
      setMessage(response.message || "Password reset successfully");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Failed to reset password");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateUser() {
    if (!selectedUserId) return;
    if (!window.confirm("Deactivate this user?")) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");
      await api.deactivateAdminUser(selectedUserId);
      setMessage("User deactivated successfully");
      handleCreateNew();
      await loadUsers();
    } catch (deactivateError) {
      setError(deactivateError instanceof Error ? deactivateError.message : "Failed to deactivate user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell
      action={
        <Button className="rounded-md px-4" onClick={handleCreateNew} variant="outline">
          <UserPlus className="h-4 w-4" />
          Add user
        </Button>
      }
      onSearchChange={setQuery}
      searchValue={query}
    >
      <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Access administration
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">Users & Access</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Create users, assign operational roles, and control endpoint-level access for read and write actions.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Users</span>
              <span className="ml-2 text-base font-semibold text-slate-950">{users.length}</span>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
              <span className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Selected role</span>
              <span className="ml-2 text-base font-semibold text-slate-950">{form.role}</span>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div> : null}
      {message ? <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
      {temporaryPassword ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Temporary password: <span className="font-semibold">{temporaryPassword}</span>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="rounded-xl border-slate-200">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Workspace users</h2>
                <p className="text-sm text-slate-500">Select a user to edit access.</p>
              </div>
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            {loading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">Loading users...</div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isActive = selectedUserId === user._id;
                  return (
                    <button
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                      key={user._id}
                      onClick={() => handleSelectUser(user)}
                      type="button"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-semibold ${isActive ? "text-white" : "text-slate-950"}`}>{user.username}</p>
                          <p className={`truncate text-xs ${isActive ? "text-slate-300" : "text-slate-500"}`}>{user.email}</p>
                        </div>
                        <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${isActive ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"}`}>
                          {user.role}
                        </span>
                      </div>
                      <div className={`mt-2 flex items-center gap-2 text-[11px] ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                        <span>{user.is_active ? "Active" : "Inactive"}</span>
                        <span>&bull;</span>
                        <span>{user.structure_count || 0} structures</span>
                      </div>
                    </button>
                  );
                })}
                {filteredUsers.length === 0 ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    No users match the current search.
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200">
          <CardContent className="p-4 md:p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">{selectedUser ? "Edit user access" : "Create user"}</h2>
                <p className="text-sm text-slate-500">Manage profile, role assignment, and endpoint permissions.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedUser ? (
                  <>
                    <Button className="rounded-md px-4" disabled={saving} onClick={handleResetPassword} variant="outline">
                      <RefreshCcw className="h-4 w-4" />
                      Reset password
                    </Button>
                    <Button className="rounded-md px-4" disabled={saving} onClick={handleDeactivateUser} variant="outline">
                      <LockKeyhole className="h-4 w-4" />
                      Deactivate
                    </Button>
                  </>
                ) : null}
                <Button className="rounded-md px-4" disabled={saving} onClick={handleSubmit}>
                  <ShieldCheck className="h-4 w-4" />
                  {saving ? "Saving..." : selectedUser ? "Update access" : "Create user"}
                </Button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Username</label>
                <Input value={form.username} onChange={(event) => updateField("username", event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</label>
                <Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">First name</label>
                <Input value={form.profile?.first_name || ""} onChange={(event) => updateProfileField("first_name", event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Last name</label>
                <Input value={form.profile?.last_name || ""} onChange={(event) => updateProfileField("last_name", event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Designation</label>
                <Input value={form.profile?.designation || ""} onChange={(event) => updateProfileField("designation", event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Organization</label>
                <Input value={form.profile?.organization || ""} onChange={(event) => updateProfileField("organization", event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Role</label>
                <select
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
                  value={form.role}
                  onChange={(event) => handleRoleChange(event.target.value)}
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input checked={Boolean(form.is_active)} onChange={(event) => updateField("is_active", event.target.checked)} type="checkbox" />
                  Active
                </label>
                <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <input checked={Boolean(form.isEmailVerified)} onChange={(event) => updateField("isEmailVerified", event.target.checked)} type="checkbox" />
                  Verified
                </label>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Endpoint access</h3>
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                  <div className="grid grid-cols-[minmax(0,1fr)_100px_100px] border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <span>Module</span>
                    <span className="text-center">Read</span>
                    <span className="text-center">Write</span>
                  </div>
                  {moduleKeys.map((moduleKey) => (
                    <div className="grid grid-cols-[minmax(0,1fr)_100px_100px] items-center border-b border-slate-200 px-3 py-3 last:border-b-0" key={moduleKey}>
                      <div>
                        <p className="text-sm font-semibold capitalize text-slate-950">{moduleKey}</p>
                        <p className="text-xs text-slate-500">Controls `{moduleKey}` endpoints.</p>
                      </div>
                      <label className="mx-auto flex items-center justify-center">
                        <input
                          checked={Boolean(form.permissions.modules[moduleKey].read)}
                          onChange={(event) => updateModulePermission(moduleKey, "read", event.target.checked)}
                          type="checkbox"
                        />
                      </label>
                      <label className="mx-auto flex items-center justify-center">
                        <input
                          checked={Boolean(form.permissions.modules[moduleKey].write)}
                          onChange={(event) => updateModulePermission(moduleKey, "write", event.target.checked)}
                          type="checkbox"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Legacy controls</h3>
                <div className="mt-3 space-y-2">
                  {legacyPermissionKeys.map((permissionKey) => (
                    <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700" key={permissionKey}>
                      <span>{permissionKey.replace(/can_|_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}</span>
                      <input
                        checked={Boolean(form.permissions[permissionKey])}
                        onChange={(event) => updateLegacyPermission(permissionKey, event.target.checked)}
                        type="checkbox"
                      />
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
