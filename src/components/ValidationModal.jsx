import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Search,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';

const normalizeText = (str) =>
  (str || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export default function ValidationModal({
  treeItem,
  apiBaseUrl,
  existingSpecies = [],
  onClose,
  onValidated,
}) {
  const props = treeItem?.properties || {};
  const [tree, setTree] = useState(props.tree || '');
  const [commonName, setCommonName] = useState(props.commonName || '');
  const [origin, setOrigin] = useState(props.origin || 'Exótica');
  const [observations, setObservations] = useState(props.observations || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Buscador conectado a Plant.id v3 Knowledge Base (desde la 3ra letra)
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchingApi, setSearchingApi] = useState(false);
  const [selectingToken, setSelectingToken] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapperRef = useRef(null);

  const plantIdKey = import.meta.env.VITE_KEY_PLANT_ID || '';

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        searchWrapperRef.current &&
        !searchWrapperRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Consulta en vivo a Plant.id v3 con debounce de 350ms desde la 3ra letra
  useEffect(() => {
    const q = speciesQuery.trim();
    if (q.length < 3) {
      setResults([]);
      setSearchingApi(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchingApi(true);
      try {
        // 1. Coincidencias locales ya censadas en tu base
        const normQ = normalizeText(q);
        const localMatches = existingSpecies
          .filter(
            (sp) =>
              normalizeText(sp.common).includes(normQ) ||
              normalizeText(sp.scientific).includes(normQ)
          )
          .map((sp) => ({
            key: `local-${sp.scientific}`,
            scientific: sp.scientific,
            common: sp.common || sp.scientific,
            origin: sp.origin || '',
            source: 'Base Arbin',
          }));

        // 2. Búsqueda en Plant.id v3 (exactamente la misma base que la app móvil)
        let plantIdEntities = [];
        if (plantIdKey) {
          const res = await fetch(
            `https://plant.id/api/v3/kb/plants/name_search?q=${encodeURIComponent(
              q
            )}&language=es&limit=12`,
            {
              headers: { 'Api-Key': plantIdKey },
              signal: controller.signal,
            }
          );
          const data = await res.json();
          plantIdEntities = data.entities || [];
        } else {
          // Si preferís no exponer la key en frontend, podés crear este proxy en tu backend
          const { data } = await api.get('/plantid/name-search', {
            params: { q },
            signal: controller.signal,
          });
          plantIdEntities = data.entities || [];
        }

        const seen = new Set(
          localMatches.map((m) => normalizeText(m.scientific))
        );
        const remoteMatches = [];

        for (const ent of plantIdEntities) {
          const sci = (ent.entity_name || '').trim();
          if (!sci) continue;
          const normSci = normalizeText(sci);
          if (seen.has(normSci)) continue;
          seen.add(normSci);

          const matchedCommon =
            ent.matched_in_type === 'common_name' && ent.matched_in
              ? ent.matched_in.charAt(0).toUpperCase() + ent.matched_in.slice(1)
              : '';

          remoteMatches.push({
            key: `plantid-${ent.access_token}`,
            accessToken: ent.access_token,
            scientific: sci,
            common: matchedCommon,
            origin: '',
            source: 'Plant.id',
          });
        }

        setResults([...localMatches, ...remoteMatches]);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Error consultando Plant.id:', err);
        }
      } finally {
        setSearchingApi(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [speciesQuery, existingSpecies, plantIdKey]);

  // Al elegir una sugerencia de Plant.id, trae su nombre científico y común oficial en español
  const handleSelectSpecies = async (sp) => {
    setTree(sp.scientific);
    if (sp.common) setCommonName(sp.common);
    if (sp.origin === 'Nativa' || sp.origin === 'Exótica') {
      setOrigin(sp.origin);
    }
    setShowDropdown(false);

    // Si viene de Plant.id y aún no tenemos el nombre común en español, lo pedimos por accessToken
    if (sp.accessToken && !sp.common) {
      setSelectingToken(true);
      try {
        let detail = null;
        if (plantIdKey) {
          const res = await fetch(
            `https://plant.id/api/v3/kb/plants/${sp.accessToken}?details=common_names&language=es`,
            { headers: { 'Api-Key': plantIdKey } }
          );
          detail = await res.json();
        } else {
          const { data } = await api.get(`/plantid/detail/${sp.accessToken}`);
          detail = data;
        }

        const officialSci = detail?.name || sp.scientific;
        const rawCommon =
          Array.isArray(detail?.common_names) && detail.common_names.length > 0
            ? detail.common_names[0]
            : '';
        const formattedCommon = rawCommon
          ? rawCommon.charAt(0).toUpperCase() + rawCommon.slice(1)
          : '';

        setTree(officialSci);
        if (formattedCommon) setCommonName(formattedCommon);
        setSpeciesQuery(
          formattedCommon ? `${formattedCommon} (${officialSci})` : officialSci
        );
      } catch (e) {
        console.warn('No se pudo obtener detalle de especie en Plant.id:', e);
        setSpeciesQuery(sp.scientific);
      } finally {
        setSelectingToken(false);
      }
    } else {
      setSpeciesQuery(
        sp.common ? `${sp.common} (${sp.scientific})` : sp.scientific
      );
    }
  };

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

      const { data } = await api.patch(
        `/censusTrees/validate/${treeItem._id}`,
        payload
      );
      onValidated(
        data.tree ||
          data.censusTree || { ...treeItem, properties: { ...props, ...payload } }
      );
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
              <p className="text-xs font-semibold text-slate-600 mb-1.5">
                Foto de Hoja / Flor
              </p>
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
              <p className="text-xs font-semibold text-slate-600 mb-1.5">
                Foto del Árbol Completo
              </p>
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
              <span className="font-semibold text-slate-700">
                {props.loadTimeSeconds || 0}s
              </span>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <span className="text-slate-400 block">Dirección / Barrio</span>
              <span className="font-semibold text-slate-700">
                {props.address} {props.neighborhood ? `(${props.neighborhood})` : ''}
              </span>
            </div>
          </div>

          {/* BUSCADOR DE ESPECIES DIRECTO EN PLANT.ID v3 */}
          <div
            ref={searchWrapperRef}
            className="relative bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5"
          >
            <label className="flex items-center justify-between text-xs font-semibold text-emerald-900 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Buscar especie en Plant.id
              </span>
              <span className="font-normal text-emerald-700">
                Escribí al menos 3 letras
              </span>
            </label>

            <div className="relative">
              <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
              <input
                type="text"
                value={speciesQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSpeciesQuery(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="Ej: Fresno, Platanus, Jacarandá, Ficus..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-emerald-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              {searchingApi || selectingToken ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-2.5 top-2.5" />
              ) : (
                speciesQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpeciesQuery('');
                      setResults([]);
                      setShowDropdown(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )
              )}
            </div>

            {showDropdown &&
              speciesQuery.trim().length > 0 &&
              speciesQuery.trim().length < 3 && (
                <p className="text-[11px] text-emerald-700 mt-1.5">
                  Ingresá {3 - speciesQuery.trim().length} carácter(es) más para buscar en Plant.id...
                </p>
              )}

            {showDropdown && speciesQuery.trim().length >= 3 && (
              <div className="absolute left-3.5 right-3.5 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {searchingApi && results.length === 0 ? (
                  <div className="px-3.5 py-3 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    Consultando catálogo de Plant.id...
                  </div>
                ) : results.length === 0 ? (
                  <div className="px-3.5 py-3 text-xs text-slate-500">
                    No se encontraron coincidencias en Plant.id.
                  </div>
                ) : (
                  results.map((sp) => (
                    <button
                      key={sp.key}
                      type="button"
                      onClick={() => handleSelectSpecies(sp)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 flex items-center justify-between gap-2 transition cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {sp.common || sp.scientific}
                        </div>
                        <div className="text-xs italic text-slate-500">
                          {sp.scientific}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                          sp.source === 'Base Arbin'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {sp.source}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
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