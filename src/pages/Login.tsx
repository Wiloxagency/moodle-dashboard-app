import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { empresasApi, type Empresa } from '../services/empresas';
import { loginUser, type StoredUser } from '../services/users';
import logo from '../assets/logo.png';

interface LocationState {
  from?: Location;
}

const LoginPage: React.FC = () => {
  const { setSessionUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ username?: string; password?: string }>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [pendingUser, setPendingUser] = useState<StoredUser | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');

  const isSuperAdminStep = !!pendingUser;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError(null);

    if (pendingUser) {
      if (!selectedEmpresa) {
        setLoginError('Seleccione una empresa para continuar');
        return;
      }
      setSubmitting(true);
      try {
        const nextUser = {
          username: pendingUser.username,
          role: pendingUser.role,
          empresa: Number(selectedEmpresa),
        };
        setSessionUser(nextUser);
        const redirectTo = state?.from?.pathname && state.from.pathname !== '/' ? state.from.pathname : '/dashboard';
        navigate(redirectTo, { replace: true });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errors.username = 'El usuario es obligatorio';
    }
    if (!password.trim()) {
      errors.password = 'La contraseña es obligatoria';
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const storedUser = await loginUser(username.trim(), password);
      if (!storedUser) {
        setLoginError('Usuario o contraseña incorrectos');
        return;
      }

      if (storedUser.username.toLowerCase() === 'superadmin') {
        setPendingUser(storedUser);
        setSelectedEmpresa('');
        setEmpresas([]);
        setLoadingEmpresas(true);
        try {
          const items = await empresasApi.list();
          const sorted = [...items].sort((a, b) =>
            String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' })
          );
          setEmpresas(sorted);
        } catch {
          setLoginError('No se pudieron cargar las empresas');
        } finally {
          setLoadingEmpresas(false);
        }
        return;
      }

      setSessionUser({
        username: storedUser.username,
        role: storedUser.role,
        empresa: storedUser.empresa,
      });

      const redirectTo = state?.from?.pathname && state.from.pathname !== '/' ? state.from.pathname : '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (e) {
      if (e instanceof Error) {
        setLoginError(e.message);
      } else {
        setLoginError('Error al iniciar sesión');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="EDUTECNO" className="h-16 w-auto mb-2" />
          <h1 className="text-xl font-semibold text-gray-800">Ingreso al Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Ingrese sus credenciales para continuar</p>
        </div>

        {loginError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={submitting || isSuperAdminStep}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 text-sm ${
                formErrors.username
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {formErrors.username && (
              <p className="mt-1 text-xs text-red-600">{formErrors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || isSuperAdminStep}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 text-sm ${
                formErrors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {formErrors.password && (
              <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
            )}
          </div>

          {isSuperAdminStep && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="empresa">
                Empresa
              </label>
              <select
                id="empresa"
                value={selectedEmpresa}
                onChange={(e) => setSelectedEmpresa(e.target.value)}
                disabled={loadingEmpresas}
                className="mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60"
              >
                <option value="">Seleccione una empresa</option>
                {empresas.map((empresa) => (
                  <option key={empresa.code} value={empresa.code}>
                    {empresa.nombre}
                  </option>
                ))}
              </select>
              {loadingEmpresas && (
                <p className="mt-1 text-xs text-gray-500">Cargando empresas...</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || (isSuperAdminStep && (!selectedEmpresa || loadingEmpresas))}
            className="w-full flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md shadow-sm transition-colors"
          >
            {submitting ? (isSuperAdminStep ? 'Continuando...' : 'Ingresando...') : (isSuperAdminStep ? 'Continuar' : 'Ingresar')}
          </button>
        </form>

      </div>
    </div>
  );
};

export default LoginPage;
