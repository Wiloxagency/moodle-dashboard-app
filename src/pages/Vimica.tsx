import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import reportesApi from '../services/reportes';
import type { VimicaPayload, VimicaResponse } from '../services/reportes';

const Vimica: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<VimicaPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [sendResponse, setSendResponse] = useState<VimicaResponse | null>(null);

  const isAllowed = Number(user?.empresa) === 1;

  const isEnviarEnabled = false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await reportesApi.getVimica();
      setData(payload);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAllowed) {
      navigate('/dashboard', { replace: true });
      return;
    }
    load();
  }, [isAllowed, load, navigate]);

  const jsonText = useMemo(() => (data ? JSON.stringify(data, null, 2) : ''), [data]);

  const handleCopy = useCallback(async () => {
    if (!jsonText) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(jsonText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = jsonText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedMessage('JSON copiado al portapapeles.');
      setTimeout(() => setCopiedMessage(null), 2500);
    } catch {
      // silencioso
    }
  }, [jsonText]);

  const handleEnviar = useCallback(async () => {
    if (!isAllowed || sending || !isEnviarEnabled) return;
    setSending(true);
    setSendResponse(null);
    try {
      let payload = data;
      if (!payload) {
        payload = await reportesApi.getVimica();
        setData(payload);
      }
      const response = await reportesApi.sendVimica(payload);
      setSendResponse(response);
    } catch {
      // silencioso
    } finally {
      setSending(false);
    }
  }, [data, isAllowed, sending]);

  return (
    <div className="p-6">
      <div className="w-full max-w-[1150px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              title="Regresar"
            >
              ← Regresar
            </button>
            <h1 className="text-2xl font-semibold text-gray-800">Vimica</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              disabled={!isAllowed || loading}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </button>
            <button
              onClick={handleCopy}
              disabled={!isAllowed || loading || !jsonText}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Copiar
            </button>
            <button
              onClick={handleEnviar}
              disabled={!isAllowed || loading || sending || !isEnviarEnabled}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>

        {copiedMessage && (
          <div className="mb-4 text-sm text-green-600">{copiedMessage}</div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">
            Vista previa JSON
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            <pre className="p-4 text-xs md:text-sm whitespace-pre-wrap break-words">
              {loading ? 'Cargando...' : jsonText}
            </pre>
          </div>
        </div>

        {sendResponse && (
          <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">
              Respuesta del endpoint
            </div>
            <div className="max-h-[40vh] overflow-y-auto">
              <pre className="p-4 text-xs md:text-sm whitespace-pre-wrap break-words">
                {JSON.stringify(sendResponse, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vimica;
