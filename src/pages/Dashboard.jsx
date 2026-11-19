import React, { useEffect, useMemo, useState } from 'react';
import {
  TreePine,
  Trees,
  Sprout,
  AlertTriangle,
  Clock,
  Search,
  Download,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Eye,
  Filter,
} from 'lucide-react';
import api from '../services/api';
import CensusMap from '../components/CensusMap';
import ValidationModal from '../components/ValidationModal';

export default function Dashboard({ currentUser, onLogout }) {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTree, setSelectedTree] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterState, setFilterState] = useState('');
  const [onlyGranPorte, setOnlyGranPorte] = useState(false);
  const [onlyReview, setOnlyReview] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  const fetchTrees = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/censusTrees');
      const list = Array.isArray(data)
        ? data
        : data.features || data.trees || data.censusTrees || data.data || [];
      setTrees(list);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error al cargar los registros del censo.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrees();
  }, []);

  // Lista única de censistas para el selector
  const censusUsers = useMemo(() => {
    const names = new Set(
      trees.map((t) => t.properties?.createdBy).filter(Boolean)
    );
    return Array.from(names).sort();
  }, [trees]);

  // Cantidad total de árboles de gran porte en la base
  const granPorteTotalCount = useMemo(() => {
    return trees.filter((t) => t.properties?.relativeHeight === 'Gran porte').length;
  }, [trees]);

  // Filtrado en memoria
  const filteredTrees = useMemo(() => {
    return trees.filter((item) => {
      const p = item.properties || {};

      if (filterUser && p.createdBy !== filterUser) return false;
      if (filterOrigin && p.origin !== filterOrigin) return false;
      if (filterState && p.visibleState !== filterState) return false;
      if (onlyGranPorte && p.relativeHeight !== 'Gran porte') return false;
      if (onlyReview && !p.needsReview) return false;

      if (dateFrom && item.createdAt) {
        const created = new Date(item.createdAt).toISOString().slice(0, 10);
        if (created < dateFrom) return false;
      }
      if (dateTo && item.createdAt) {
        const created = new Date(item.createdAt).toISOString().slice(0, 10);
        if (created > dateTo) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          p.tree?.toLowerCase().includes(q) ||
          p.commonName?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.neighborhood?.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    trees,
    searchTerm,
    filterUser,
    filterOrigin,
    filterState,
    onlyGranPorte,
    onlyReview,
    dateFrom,
    dateTo,
  ]);

  // KPIs calculados sobre los registros filtrados
  const kpis = useMemo(() => {
    const total = filteredTrees.length;
    const nativas = filteredTrees.filter(
      (t) => t.properties?.origin === 'Nativa'
    ).length;
    const pendientes = filteredTrees.filter(
      (t) => t.properties?.needsReview
    ).length;
    const criticos = filteredTrees.filter((t) =>
      ['Malo', 'Seco'].includes(t.properties?.visibleState)
    ).length;
    const avgSeconds =
      total > 0
        ? Math.round(
            filteredTrees.reduce(
              (acc, t) => acc + (Number(t.properties?.loadTimeSeconds) || 0),
              0
            ) / total
          )
        : 0;

    return {
      total,
      nativas,
      nativasPct: total > 0 ? Math.round((nativas / total) * 100) : 0,
      pendientes,
      criticos,
      avgSeconds,
    };
  }, [filteredTrees]);

  // Top 5 especies más censadas
  const topSpecies = useMemo(() => {
    const counts = {};
    filteredTrees.forEach((t) => {
      const name = t.properties?.commonName || t.properties?.tree || 'Sin identificar';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredTrees]);

  const handleTreeValidated = (updatedTree) => {
    setTrees((prev) =>
      prev.map((t) => (t._id === updatedTree._id ? updatedTree : t))
    );
  };

  // Exportar CSV para Excel
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Fecha',
      'Especie Cientifica',
      'Nombre Comun',
      'Origen',
      'Altura Relativa',
      'Estado Visible',
      'Direccion',
      'Barrio',
      'Latitud',
      'Longitud',
      'Censista',
      'Tiempo Carga (s)',
      'Requiere Revision',
      'Observaciones',
    ];

    const rows = filteredTrees.map((t) => {
      const p = t.properties || {};
      const [lng = '', lat = ''] = t.geometry?.coordinates || [];
      return [
        t._id,
        t.createdAt ? new Date(t.createdAt).toLocaleString('es-AR') : '',
        p.tree || '',
        p.commonName || '',
        p.origin || '',
        p.relativeHeight || '',
        p.visibleState || '',
        p.address || '',
        p.neighborhood || '',
        lat,
        lng,
        p.createdBy || '',
        p.loadTimeSeconds || 0,
        p.needsReview ? 'SI' : 'NO',
        (p.observations || '').replace(/[\r\n]+/g, ' '),
      ]
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `censo_arbin_lanus_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <TreePine className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 leading-tight">
                Arbin Lanús — Control de Censo
              </h1>
              <p className="text-xs text-slate-500">
                Sesión: <span className="font-medium text-slate-700">{currentUser?.name}</span> ({currentUser?.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTrees}
              title="Actualizar datos"
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-sm font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Árboles Censados</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TreePine className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 mt-2">{kpis.total}</p>
            <p className="text-xs text-slate-400 mt-1">
              {kpis.criticos} en estado Malo o Seco
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Especies Nativas</span>
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Sprout className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 mt-2">
              {kpis.nativas} <span className="text-base font-normal text-slate-400">({kpis.nativasPct}%)</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {kpis.total - kpis.nativas} especies exóticas
            </p>
          </div>

          <div
            onClick={() => setOnlyReview((prev) => !prev)}
            className={`p-5 rounded-2xl border shadow-xs cursor-pointer transition ${
              onlyReview
                ? 'bg-amber-50 border-amber-400'
                : 'bg-white border-slate-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Pendientes Revisión</span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-700 mt-2">{kpis.pendientes}</p>
            <p className="text-xs text-amber-700/80 mt-1">
              {onlyReview ? 'Mostrando solo pendientes (clic para quitar)' : 'Clic para filtrar dudosos'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">Tiempo Promedio</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800 mt-2">{kpis.avgSeconds}s</p>
            <p className="text-xs text-slate-400 mt-1">
              Por ejemplar relevado en campo
            </p>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filtros de búsqueda y avance
            </span>

            <div className="flex items-center gap-3">
              {/* Toggle directo para Gran porte */}
              <button
                type="button"
                onClick={() => setOnlyGranPorte((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  onlyGranPorte
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                <Trees className="w-3.5 h-3.5" />
                Gran porte ({granPorteTotalCount})
              </button>

              {(searchTerm ||
                filterUser ||
                filterOrigin ||
                filterState ||
                onlyGranPorte ||
                onlyReview ||
                dateFrom ||
                dateTo) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterUser('');
                    setFilterOrigin('');
                    setFilterState('');
                    setOnlyGranPorte(false);
                    setOnlyReview(false);
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="text-xs text-emerald-600 hover:underline font-medium cursor-pointer"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar especie, calle o barrio..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">Todos los censistas</option>
              {censusUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <select
              value={filterOrigin}
              onChange={(e) => setFilterOrigin(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">Origen (Todos)</option>
              <option value="Nativa">Nativa</option>
              <option value="Exótica">Exótica</option>
            </select>

            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">Estado (Todos)</option>
              <option value="Bueno">Bueno</option>
              <option value="Regular">Regular</option>
              <option value="Malo">Malo</option>
              <option value="Seco">Seco</option>
            </select>

            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="Desde fecha"
                className="w-1/2 px-2 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="Hasta fecha"
                className="w-1/2 px-2 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Mapa + Top Especies */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CensusMap
              trees={filteredTrees}
              apiBaseUrl={apiBaseUrl}
              onSelectTree={(item) => setSelectedTree(item)}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-slate-800 text-sm mb-4">
                Especies más frecuentes
              </h2>
              {topSpecies.length === 0 ? (
                <p className="text-sm text-slate-400">Sin datos para mostrar.</p>
              ) : (
                <div className="space-y-3.5">
                  {topSpecies.map(([name, count]) => {
                    const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0;
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700 truncate pr-2">
                            {name}
                          </span>
                          <span className="text-slate-500 shrink-0">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
              Hacé clic sobre cualquier punto del mapa o fila de la tabla para inspeccionar fotos y validar ejemplares marcados para revisión.
            </div>
          </div>
        </div>

        {/* Tabla de registros */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm">
              Detalle de Ejemplares Relevados ({filteredTrees.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-3 px-4">Especie</th>
                  <th className="py-3 px-4">Origen</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Dirección</th>
                  <th className="py-3 px-4">Censista</th>
                  <th className="py-3 px-4">Revisión</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se encontraron árboles con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredTrees.map((item) => {
                    const p = item.properties || {};
                    const isGranPorte = p.relativeHeight === 'Gran porte';
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-slate-800">
                              {p.commonName || p.tree}
                            </span>
                            {isGranPorte && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                                <Trees className="w-3 h-3" /> Gran porte
                              </span>
                            )}
                          </div>
                          <div className="text-xs italic text-slate-400">{p.tree}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.origin === 'Nativa'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {p.origin}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium text-slate-700">
                          {p.visibleState}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {p.address}
                          {p.neighborhood ? ` (${p.neighborhood})` : ''}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {p.createdBy}
                        </td>
                        <td className="py-3 px-4">
                          {p.needsReview ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3" /> Revisar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> Validado
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedTree(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Validar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {selectedTree && (
        <ValidationModal
          treeItem={selectedTree}
          apiBaseUrl={apiBaseUrl}
          onClose={() => setSelectedTree(null)}
          onValidated={handleTreeValidated}
        />
      )}
    </div>
  );
}