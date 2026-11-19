import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import api from '../services/api';

export default function ValidationModal({ treeItem, apiBaseUrl, onClose, onValidated }) {
  const props = treeItem?.properties || {};
  const [tree, setTree] = useState(props.tree || '');
  const [commonName, setCommonName] = useState(props.commonName || '');
  const [origin, setOrigin] = useState(props.origin || 'Exótica');
  const [observations, setObservations] = useState(props.observations || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!treeItem) return null;

  const serverOrigin = apiBaseUrl.replace(/\/api\/?$/, '');

  const resolveImgUrl = (imgPath, treeName) => {
    if (!imgPath) return null;
    if (imgPath.startsWith('http') || imgPath.startsWith('data:')) return imgPath;
    const cleanPath = imgPath.replace(/\\/g, '/').replace(/^\/+/, '');
    if (cleanPath.startsWith('img/')) {
      return `${serverOrigin}/${cleanPath}`;
    }
    const safeFolder = (treeName || 'general')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñ_-]/gi, '_');

    return `${serverOrigin}/img/${safeFolder}/${cleanPath}`;
  };

  const handleImgFallback = (e, rawImg) => {
    if (!rawImg) return;
    const cleanPath = rawImg.replace(/\\/g, '/').replace(/^\/+/, '');
    const fallbackUrl = `${serverOrigin}/img/general/${cleanPath}`;
    if (e.currentTarget.src !== fallbackUrl) {
      e.currentTarget.src = fallbackUrl;
      if (e.currentTarget.parentElement?.tagName === 'A') {
        e.currentTarget.parentElement.href = fallbackUrl;
      }
    }
  };

  const leafSrc = resolveImgUrl(props.leafImg, props.tree);
  const profileSrc = resolveImgUrl(props.profileImg, props.tree);

  const handleValidate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        tree: tree.trim(),
        commonName: commonName.trim(),
        origin,
        observations: observations.trim(),
        needsReview: false,
      };

      const { data } = await api.patch(`/censusTrees/validate/${treeItem._id}`, payload);
      onValidated(data.tree || data.censusTree || { ...treeItem, properties: { ...props, ...payload } });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al validar el ejemplar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-slate-800">
              Revisión y Validación de Ejemplar
            </h3>
            {props.needsReview && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5" /> Pendiente de revisión
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleValidate} className="p-6 overflow-y-auto space-y-5">
          {/* Fotos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-2 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Foto de Hoja / Flor</p>
              {leafSrc ? (
                <a href={leafSrc} target="_blank" rel="noreferrer">
                  <img
                    src={leafSrc}
                    alt="Hoja"
                    onError={(e) => handleImgFallback(e, props.leafImg)}
                    className="w-full h-44 object-cover rounded-lg hover:opacity-95"
                  />
                </a>
              ) : (
                <div className="w-full h-44 rounded-lg bg-slate-200/70 flex items-center justify-center text-xs text-slate-500">
                  Sin foto de hoja
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl p-2 bg-slate-50">
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Foto del Árbol Completo</p>
              {profileSrc ? (
                <a href={profileSrc} target="_blank" rel="noreferrer">
                  <img
                    src={profileSrc}
                    alt="Árbol completo"
                    onError={(e) => handleImgFallback(e, props.profileImg)}
                    className="w-full h-44 object-cover rounded-lg hover:opacity-95"
                  />
                </a>
              ) : (
                <div className="w-full h-44 rounded-lg bg-slate-200/70 flex items-center justify-center text-xs text-slate-500">
                  Sin foto de perfil
                </div>
              )}
            </div>
          </div>

          {/* Datos de contexto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block">Censista</span>
              <span className="font-semibold text-slate-700">{props.createdBy}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Altura</span>
              <span className="font-semibold text-slate-700">{props.relativeHeight}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Estado</span>
              <span className="font-semibold text-slate-700">{props.visibleState}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Tiempo carga</span>
              <span className="font-semibold text-slate-700">{props.loadTimeSeconds || 0}s</span>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <span className="text-slate-400 block">Dirección / Barrio</span>
              <span className="font-semibold text-slate-700">
                {props.address} {props.neighborhood ? `(${props.neighborhood})` : ''}
              </span>
            </div>
          </div>

          {/* Campos editables de validación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre Científico *
              </label>
              <input
                type="text"
                required
                value={tree}
                onChange={(e) => setTree(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre Común
              </label>
              <input
                type="text"
                value={commonName}
                onChange={(e) => setCommonName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Origen
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Nativa">Nativa</option>
                <option value="Exótica">Exótica</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observaciones
              </label>
              <input
                type="text"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Notas de relevamiento o validación..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Aprobar y Validar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}