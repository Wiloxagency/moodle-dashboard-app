import React, { useEffect, useMemo, useState } from 'react';
import type { Role } from '../types/auth';
import {
  listUsers,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  type StoredUser,
} from '../services/users';
import { empresasApi, type Empresa } from '../services/empresas';

interface UserFormState {
  id?: string;
  username: string;
  role: Role;
  password: string;
  empresa: number | '';
}

const emptyForm: UserFormState = {
  username: '',
  role: 'user',
  password: '',
  empresa: '',
};

const UsuariosPage: React.FC = () => {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);

  const empresaByCode = useMemo(() => {
    const map: Record<number, string> = {};
    for (const e of empresas) {
      map[e.code] = e.nombre;
    }
    return map;
  }, [empresas]);

  const load = async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
      setError('Error cargando usuarios');
    }
  };

  const loadEmpresas = async () => {
    try {
      const data = await empresasApi.list();
      setEmpresas(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    loadEmpresas();
  }, []);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleChange = (field: keyof UserFormState, value: string | Role | number | '') => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleEmpresaChange = (value: string) => {
    if (value === '') {
      setForm(prev => ({ ...prev, empresa: '' }));
      return;
    }
    const num = Number(value);
    setForm(prev => ({ ...prev, empresa: Number.isFinite(num) ? num : '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!form.username.trim()) {
      setError('El nombre de usuario es obligatorio');
      return;
    }

    if (form.empresa === '' || !Number.isFinite(Number(form.empresa))) {
      setError('La empresa es obligatoria');
      return;
    }

    if (!editingId && !form.password) {
      setError('La contraseña es obligatoria para nuevos usuarios');
      return;
    }

    try {
      if (!editingId) {
        // Crear nuevo usuario
        await createUser(form.username, form.role, form.password, Number(form.empresa));
        setSuccess('Usuario creado correctamente');
      } else {
        // Actualizar usuario (sin cambiar contraseña aquí)
        await updateUser(editingId, {
          username: form.username,
          role: form.role,
          empresa: Number(form.empresa),
        });
        setSuccess('Usuario actualizado correctamente');
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Error guardando usuario');
    }
  };

  const handleEdit = (user: StoredUser) => {
    resetMessages();
    setEditingId(user.id);
    setForm({
      id: user.id,
      username: user.username,
      role: user.role,
      password: '', // no mostramos ni editamos la contraseña aquí
      empresa: user.empresa ?? '',
    });
  };

  const handleDelete = async (user: StoredUser) => {
    resetMessages();
    if (!window.confirm(`¿Eliminar usuario "${user.username}"?`)) return;
    try {
      await deleteUser(user.id);
      setSuccess('Usuario eliminado correctamente');
      load();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Error eliminando usuario');
    }
  };

  const openPasswordDialog = (user: StoredUser) => {
    resetMessages();
    setPasswordUserId(user.id);
    setNewPassword('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUserId) return;
    if (!newPassword) {
      setError('La nueva contraseña es obligatoria');
      return;
    }
    try {
      await changePassword(passwordUserId, newPassword);
      setSuccess('Contraseña actualizada correctamente');
      setPasswordUserId(null);
      setNewPassword('');
      load();
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Error actualizando contraseña');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Centro de Control de Acceso</h1>
            <p className="text-gray-600 text-sm">
              Desde esta pestaña el rol <strong>Superadmin</strong> administra todas las cuentas del sistema.
              Solo existen dos roles posibles: <strong>Superadmin</strong> y <strong>User</strong>. Las contraseñas
              definidas aquí son las <strong>únicas válidas</strong> para acceder al sistema.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              {success}
            </div>
          )}

          {/* Formulario de creación/edición de usuarios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              {editingId ? 'Editar usuario' : 'Crear nuevo usuario'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
                  Usuario
                </label>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={e => handleChange('username', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
                  Rol
                </label>
                <select
                  id="role"
                  value={form.role}
                  onChange={e => handleChange('role', e.target.value as Role)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="superAdmin">Superadmin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="empresa">
                  Empresa
                </label>
                <select
                  id="empresa"
                  value={form.empresa === '' ? '' : String(form.empresa)}
                  onChange={e => handleEmpresaChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">Seleccione empresa...</option>
                  {empresas.map((e) => (
                    <option key={e._id || e.code} value={e.code}>
                      {e.code} - {e.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={e => handleChange('password', e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              <div className="flex space-x-2 justify-start">
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm"
                >
                  {editingId ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>

          {/* Tabla de usuarios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Usuarios registrados</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2">Usuario</th>
                    <th className="px-3 py-2">Empresa</th>
                    <th className="px-3 py-2">Rol</th>
                    <th className="px-3 py-2 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-800">{user.username}</td>
                      <td className="px-3 py-2 text-gray-700">
                        {empresaByCode[user.empresa] || user.empresa}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {user.role === 'superAdmin' ? 'Superadmin' : 'User'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => openPasswordDialog(user)}
                          className="px-2 py-1 text-xs border border-blue-300 rounded-md text-blue-700 hover:bg-blue-50"
                        >
                          Cambiar contraseña
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          className="px-2 py-1 text-xs border border-red-300 rounded-md text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-gray-500 text-sm">
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo simple para cambiar contraseña */}
      {passwordUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Cambiar contraseña</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="new-password">
                  Nueva contraseña
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setPasswordUserId(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
