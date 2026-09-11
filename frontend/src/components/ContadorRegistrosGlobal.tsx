import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { sincronizarMetricasBD, toggleAutoRefresh } from "../store/slices/dbMetricsSlice";
import "./ContadorRegistrosGlobal.css";

const ContadorRegistrosGlobal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { canchas, reservas, usuarios, status, lastSync, autoRefreshEnabled } = useAppSelector(
    (state) => state.dbMetrics
  );

  const [expandido, setExpandido] = useState<boolean>(false);

  // Sincronización inicial con la base de datos
  useEffect(() => {
    dispatch(sincronizarMetricasBD());
  }, [dispatch]);

  // Polling en tiempo real vinculado a las tablas de la BD cada 20 segundos
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const intervalId = setInterval(() => {
      dispatch(sincronizarMetricasBD());
    }, 20000);

    return () => clearInterval(intervalId);
  }, [dispatch, autoRefreshEnabled]);

  const handleManualRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(sincronizarMetricasBD());
  };

  const handleToggleAuto = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleAutoRefresh());
  };

  return (
    <aside
      className="fz-contador-global-container"
      aria-label="Panel de Métricas en Tiempo Real (Estado Global Redux)"
    >
      {!expandido ? (
        /* Píldora Minimizada */
        <div
          className="fz-contador-pill-mini"
          onClick={() => setExpandido(true)}
          title="Clic para ver métricas globales de la Base de Datos"
        >
          <span
            className={`fz-live-pulse-dot ${status === "loading" ? "loading" : ""}`}
            title={status === "loading" ? "Sincronizando..." : "En Vivo con BD"}
          />

          <div className="fz-contador-chips-row">
            <span className="fz-badge-label">BD Global:</span>

            <div className="fz-chip-stat" title="Tabla canchas">
              <span>🏟️</span>
              <strong>{canchas.total}</strong> Canchas
            </div>

            <div className="fz-chip-stat" title="Tabla reservas">
              <span>📅</span>
              <strong>{reservas.total}</strong> Reservas
            </div>

            <div className="fz-chip-stat" title="Tabla usuarios">
              <span>👥</span>
              <strong>{usuarios.total}</strong> Usuarios
            </div>
          </div>

          <button
            className={`fz-btn-icon-action ${status === "loading" ? "spinning" : ""}`}
            onClick={handleManualRefresh}
            title="Refrescar datos de la Base de Datos"
          >
            ↻
          </button>
        </div>
      ) : (
        /* Tarjeta Expandida con Detalle de Tablas */
        <div className="fz-contador-card-expanded">
          <div className="fz-contador-card-header">
            <h4>
              <span className={`fz-live-pulse-dot ${status === "loading" ? "loading" : ""}`} />
              Estado Global · Base de Datos
            </h4>
            <div className="fz-contador-header-actions">
              <button
                className={`fz-btn-icon-action ${status === "loading" ? "spinning" : ""}`}
                onClick={handleManualRefresh}
                title="Sincronizar ahora"
              >
                ↻
              </button>
              <button
                className="fz-btn-icon-action"
                onClick={handleToggleAuto}
                title={autoRefreshEnabled ? "Pausar actualización en vivo" : "Reanudar actualización en vivo"}
                style={{ color: autoRefreshEnabled ? "#10b981" : "#94a3b8" }}
              >
                {autoRefreshEnabled ? "⏱️" : "⏸️"}
              </button>
              <button
                className="fz-btn-icon-action"
                onClick={() => setExpandido(false)}
                title="Minimizar panel"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="fz-contador-card-body">
            {/* Tabla: canchas */}
            <div className="fz-tabla-stat-block">
              <div className="fz-stat-title-row">
                <span>Canchas Registradas</span>
                <code className="fz-stat-table-badge">tabla: canchas</code>
              </div>
              <div className="fz-stat-big-number">{canchas.total}</div>
              <div className="fz-stat-subdetail">
                ✓ {canchas.activas} activas para reserva online
              </div>
            </div>

            {/* Tabla: reservas */}
            <div className="fz-tabla-stat-block">
              <div className="fz-stat-title-row">
                <span>Turnos Agendados</span>
                <code className="fz-stat-table-badge">tabla: reservas</code>
              </div>
              <div className="fz-stat-big-number">{reservas.total}</div>
              <div className="fz-stat-subdetail">
                ✓ {reservas.confirmadas} confirmadas · {reservas.pendientes} pendientes
              </div>
            </div>

            {/* Tabla: usuarios */}
            <div className="fz-tabla-stat-block">
              <div className="fz-stat-title-row">
                <span>Usuarios en Plataforma</span>
                <code className="fz-stat-table-badge">tabla: usuarios</code>
              </div>
              <div className="fz-stat-big-number">{usuarios.total}</div>
              <div className="fz-stat-subdetail">
                ✓ {usuarios.clientes} clientes deportivos registrados
              </div>
            </div>

            {/* Info inferior */}
            <div className="fz-contador-footer-info">
              <span className="fz-live-sync-indicator">
                <span className={`fz-live-pulse-dot ${status === "loading" ? "loading" : ""}`} />
                {status === "loading" ? "Actualizando datos..." : "Sincronizado con API / BD"}
              </span>
              <span>Última vez: {lastSync || "Iniciando..."}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ContadorRegistrosGlobal;
