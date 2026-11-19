import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import { AlertTriangle, CheckCircle2, Eye, Trees } from "lucide-react";

const STATE_COLORS = {
  Bueno: "#16a34a",
  Regular: "#eab308",
  Malo: "#ea580c",
  Seco: "#dc2626",
};

function MapBoundsUpdater({ trees }) {
  const map = useMap();

  useEffect(() => {
    const validCoords = trees
      .map((t) => t.geometry?.coordinates)
      .filter(
        (c) =>
          Array.isArray(c) && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1]),
      )
      .map(([lng, lat]) => [lat, lng]);

    if (validCoords.length > 0) {
      map.fitBounds(validCoords, { padding: [40, 40], maxZoom: 16 });
    }
  }, [trees, map]);

  return null;
}

export default function CensusMap({ trees, apiBaseUrl, onSelectTree }) {
  const serverOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

  const resolveImgUrl = (imgPath, treeName) => {
    if (!imgPath) return null;
    if (imgPath.startsWith("http") || imgPath.startsWith("data:"))
      return imgPath;
    const cleanPath = imgPath.replace(/\\/g, "/").replace(/^\/+/, "");
    if (cleanPath.startsWith("img/")) {
      return `${serverOrigin}/${cleanPath}`;
    }
    const safeFolder = (treeName || "general")
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñ_-]/gi, "_");

    return `${serverOrigin}/img/${safeFolder}/${cleanPath}`;
  };

  const handleImgFallback = (e, rawImg) => {
    if (!rawImg) return;
    const cleanPath = rawImg.replace(/\\/g, "/").replace(/^\/+/, "");
    const fallbackUrl = `${serverOrigin}/img/general/${cleanPath}`;
    if (e.currentTarget.src !== fallbackUrl) {
      e.currentTarget.src = fallbackUrl;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-slate-800 text-sm">
          Mapa Georreferenciado ({trees.length} ejemplares)
        </h2>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
          {Object.entries(STATE_COLORS).map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: color }}
              />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 font-medium text-indigo-700">
            <span className="w-4 h-4 rounded-full border-2 border-indigo-600 bg-indigo-100/70 inline-block" />
            Gran porte
          </span>
          <span className="flex items-center gap-1.5 font-medium text-amber-700">
            <span className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-100 inline-block" />
            A revisar
          </span>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[-34.7065, -58.3935]}
          zoom={13}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
            url={`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png${
              import.meta.env.VITE_STADIA_API_KEY
                ? `?api_key=${import.meta.env.VITE_STADIA_API_KEY}`
                : ""
            }`}
          />
          <MapBoundsUpdater trees={trees} />

          {trees.map((item) => {
            const coords = item.geometry?.coordinates;
            if (!Array.isArray(coords) || coords.length < 2) return null;

            const [lng, lat] = coords;
            const props = item.properties || {};
            const fillColor = STATE_COLORS[props.visibleState] || "#64748b";
            const isGranPorte = props.relativeHeight === "Gran porte";
            const leafSrc = resolveImgUrl(props.leafImg, props.tree);
            const profileSrc = resolveImgUrl(props.profileImg, props.tree);

            const baseRadius = isGranPorte ? 13 : props.needsReview ? 9 : 7;
            const strokeColor = props.needsReview
              ? "#f59e0b"
              : isGranPorte
                ? "#4f46e5"
                : "#ffffff";

            return (
              <React.Fragment key={item._id}>
                {/* Halo exterior para ejemplares de Gran porte */}
                {isGranPorte && (
                  <CircleMarker
                    center={[lat, lng]}
                    radius={18}
                    interactive={false}
                    pathOptions={{
                      fillColor: "#6366f1",
                      fillOpacity: 0.16,
                      color: "#4f46e5",
                      weight: 1.5,
                      dashArray: "4 3",
                    }}
                  />
                )}

                <CircleMarker
                  center={[lat, lng]}
                  radius={baseRadius}
                  pathOptions={{
                    fillColor,
                    color: strokeColor,
                    weight: isGranPorte || props.needsReview ? 3 : 1.5,
                    fillOpacity: 0.92,
                  }}
                >
                  <Popup maxWidth={260}>
                    <div className="text-slate-800 space-y-1.5 py-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm leading-tight m-0">
                            {props.commonName || props.tree}
                          </p>
                          <p className="italic text-xs text-slate-500 m-0">
                            {props.tree}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {props.needsReview ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[11px] font-medium">
                              <AlertTriangle className="w-3 h-3" /> Revisar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                              <CheckCircle2 className="w-3 h-3" /> Validado
                            </span>
                          )}
                          {isGranPorte && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-semibold">
                              <Trees className="w-3 h-3" /> Gran porte
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 space-y-0.5 border-t border-slate-100 pt-1">
                        <p className="m-0">
                          <strong>Origen:</strong> {props.origin}
                        </p>
                        <p className="m-0">
                          <strong>Altura:</strong> {props.relativeHeight}
                        </p>
                        <p className="m-0">
                          <strong>Estado:</strong> {props.visibleState}
                        </p>
                        <p className="m-0">
                          <strong>Dirección:</strong> {props.address}
                        </p>
                        <p className="m-0">
                          <strong>Censista:</strong> {props.createdBy}
                        </p>
                      </div>

                      {(leafSrc || profileSrc) && (
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {leafSrc && (
                            <img
                              src={leafSrc}
                              alt="Hoja"
                              onError={(e) =>
                                handleImgFallback(e, props.leafImg)
                              }
                              className="w-full h-16 object-cover rounded border border-slate-200"
                            />
                          )}
                          {profileSrc && (
                            <img
                              src={profileSrc}
                              alt="Perfil"
                              onError={(e) =>
                                handleImgFallback(e, props.profileImg)
                              }
                              className="w-full h-16 object-cover rounded border border-slate-200"
                            />
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => onSelectTree(item)}
                        className="w-full mt-1.5 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver detalle / Validar
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
