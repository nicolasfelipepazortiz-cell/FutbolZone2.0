import { useState, useEffect } from "react";
import "./TablonRetos.css";
import Icons from "./Icons";
import { getStoredUser } from "../services/api";

interface Convocatoria {
  id: string;
  organizador: string;
  organizadorEmail?: string;
  cancha: string;
  fecha: string;
  hora: string;
  cuposTotales: number;
  cuposOcupados: number;
  nivel: string;
  posicionBuscada: string;
  descripcion: string;
  jugadoresUnidos: string[];
}

interface TablonRetosProps {
  onRequireLogin?: () => void;
  usuario?: any;
}

const STORAGE_KEY = "fz_convocatorias_retos_v3";

const CONVOCATORIAS_INICIALES: Convocatoria[] = [
  {
    id: "ret_1",
    organizador: "Santiago Rodríguez (Capitán)",
    organizadorEmail: "santiago@futbolzone.com",
    cancha: "Cancha Fútbol 5 (Central)",
    fecha: "Hoy",
    hora: "19:00 - 20:00",
    cuposTotales: 10,
    cuposOcupados: 4,
    nivel: "Amistoso / Todos los niveles",
    posicionBuscada: "1 Volante y Delanteros",
    descripcion: "Nos faltan 6 jugadores para armar el 5 vs 5 de la noche. Partido con buena onda y tercer tiempo.",
    jugadoresUnidos: ["Santiago R.", "Camilo V.", "David K.", "Andrés M."],
  },
  {
    id: "ret_2",
    organizador: "Mateo Gómez",
    organizadorEmail: "mateo@futbolzone.com",
    cancha: "Cancha Fútbol 7 (Norte)",
    fecha: "Mañana",
    hora: "20:00 - 21:00",
    cuposTotales: 14,
    cuposOcupados: 6,
    nivel: "Competitivo / Reto",
    posicionBuscada: "1 Arquero fijo y 2 Defensas",
    descripcion: "Reto nocturno con iluminación LED de alta potencia. Buscamos arquero y defensas con buen ritmo.",
    jugadoresUnidos: ["Mateo G.", "Felipe P.", "Daniel C.", "Oscar L.", "Esteban S.", "Javier R."],
  },
  {
    id: "ret_3",
    organizador: "Carlos Díaz",
    organizadorEmail: "cliente@futbolzone.com",
    cancha: "Cancha Fútbol 11 (Sur)",
    fecha: "Domingo",
    hora: "17:00 - 18:30",
    cuposTotales: 22,
    cuposOcupados: 12,
    nivel: "Amistoso / Recreativo",
    posicionBuscada: "Defensas, Mediocampistas y Extremos",
    descripcion: "Partido dominical en cancha reglamentaria completa. ¡Cualquiera puede sumarse a jugar!",
    jugadoresUnidos: ["Carlos D.", "Juan M.", "David R.", "Oscar L.", "Mateo T.", "Diego B.", "Andrés V.", "Lucas H.", "Gabriel F.", "Samuel P.", "Julián N.", "Mario C."],
  },
];

function TablonRetos({ onRequireLogin }: TablonRetosProps) {
  const usuario = getStoredUser();
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [mostrarForm, setMostrarForm] = useState<boolean>(false);
  const [filtroCancha, setFiltroCancha] = useState<string>("todas");

  // Estados para nueva convocatoria
  const [cancha, setCancha] = useState<string>("Cancha Fútbol 5 (Central)");
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split("T")[0]);
  const [hora, setHora] = useState<string>("19:00");
  const [cuposTotales, setCuposTotales] = useState<number>(10);
  const [posicionBuscada, setPosicionBuscada] = useState<string>("1 Arquero y 2 Defensas");
  const [nivel, setNivel] = useState<string>("Amistoso / Todos los niveles");
  const [descripcion, setDescripcion] = useState<string>("");

  useEffect(() => {
    cargarConvocatorias();
  }, []);

  const cargarConvocatorias = () => {
    try {
      localStorage.removeItem("fz_convocatorias_retos");
      localStorage.removeItem("fz_convocatorias_retos_v2");
    } catch {}

    const guardadas = localStorage.getItem(STORAGE_KEY);
    if (guardadas) {
      try {
        const parsed = JSON.parse(guardadas);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConvocatorias(parsed);
          return;
        }
      } catch {}
    }

    setConvocatorias(CONVOCATORIAS_INICIALES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(CONVOCATORIAS_INICIALES));
  };

  const guardar = (nuevas: Convocatoria[]) => {
    setConvocatorias(nuevas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevas));
  };

  const reiniciarConvocatorias = () => {
    if (!confirm("[ADMINISTRADOR] ¿Deseas restaurar la lista de convocatorias a su estado original con todos los cupos libres?")) return;
    guardar(CONVOCATORIAS_INICIALES);
    alert("Convocatorias restauradas con éxito.");
  };

  const toggleUnirseAConvocatoria = (retId: string) => {
    if (!usuario) {
      const confirmar = confirm("Para unirte a la nómina de este partido debes iniciar sesión como Cliente.\n\n¿Deseas ir a la pantalla de Inicio de Sesión ahora?");
      if (confirmar && onRequireLogin) {
        onRequireLogin();
      }
      return;
    }

    const miNombre = `${usuario.nombre || "Jugador"} ${usuario.apellido || ""}`.trim();

    const actualizadas = convocatorias.map((c) => {
      if (c.id === retId) {
        const yaEstaUnido = c.jugadoresUnidos.includes(miNombre);

        if (yaEstaUnido) {
          const confirmSalida = confirm(`¿Deseas salirte de la convocatoria de ${c.organizador}? Se liberará tu cupo.`);
          if (!confirmSalida) return c;

          return {
            ...c,
            cuposOcupados: Math.max(0, c.cuposOcupados - 1),
            jugadoresUnidos: c.jugadoresUnidos.filter((j) => j !== miNombre),
          };
        } else {
          if (c.cuposOcupados >= c.cuposTotales) {
            alert("La nómina de este partido ya está completa.");
            return c;
          }

          alert(`¡Listo ${usuario.nombre}! Te has unido al partido de ${c.organizador}.`);
          return {
            ...c,
            cuposOcupados: c.cuposOcupados + 1,
            jugadoresUnidos: [...c.jugadoresUnidos, miNombre],
          };
        }
      }
      return c;
    });

    guardar(actualizadas);
  };

  const eliminarConvocatoria = (retId: string) => {
    if (!confirm("¿Deseas eliminar esta convocatoria?")) return;
    const actualizadas = convocatorias.filter((c) => c.id !== retId);
    guardar(actualizadas);
  };

  const clickBotonPublicar = () => {
    if (!usuario) {
      const confirmar = confirm("Para publicar una convocatoria o buscar jugadores debes iniciar sesión como Cliente.\n\n¿Deseas ir a Iniciar Sesión ahora?");
      if (confirmar && onRequireLogin) {
        onRequireLogin();
      }
      return;
    }
    setMostrarForm(!mostrarForm);
  };

  const crearConvocatoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) {
      if (onRequireLogin) onRequireLogin();
      return;
    }

    const miNombre = `${usuario.nombre || "Jugador"} ${usuario.apellido || ""}`.trim();

    const nueva: Convocatoria = {
      id: `ret_${Date.now()}`,
      organizador: miNombre,
      organizadorEmail: usuario.email || "",
      cancha,
      fecha,
      hora,
      cuposTotales: Number(cuposTotales),
      cuposOcupados: 1,
      nivel,
      posicionBuscada: posicionBuscada.trim() || "Cualquier posición",
      descripcion: descripcion.trim() || "Partido abierto buscando completar equipo.",
      jugadoresUnidos: [miNombre],
    };

    const actualizadas = [nueva, ...convocatorias];
    guardar(actualizadas);
    setMostrarForm(false);
    setDescripcion("");
    alert("Tu convocatoria ha sido publicada en el Tablón de Retos.");
  };

  const convocatoriasFiltradas = convocatorias.filter((c) => {
    if (filtroCancha === "todas") return true;
    if (filtroCancha === "f5") return c.cancha.includes("5");
    if (filtroCancha === "f7") return c.cancha.includes("7");
    if (filtroCancha === "f11") return c.cancha.includes("11");
    return true;
  });

  const miNombreUsuario = usuario ? `${usuario.nombre || "Jugador"} ${usuario.apellido || ""}`.trim() : "";
  const esAdmin = usuario?.rol === "admin";

  return (
    <section id="retos" className="fz-retos-section">
      <div className="fz-retos-header">
        <span className="section-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Icons.Users size={14} color="#10b981" />
          Comunidad & Partidos Abiertos
        </span>
        <h2>Tablón de Retos & Buscador de Jugadores</h2>
        <p>
          ¿Te faltan jugadores para armar tu partido? Revisa las convocatorias disponibles o publica la tuya.
        </p>

        <div className="fz-retos-top-actions">
          <div className="fz-retos-filters">
            <button
              type="button"
              className={`fz-filter-chip ${filtroCancha === "todas" ? "active" : ""}`}
              onClick={() => setFiltroCancha("todas")}
            >
              Todos
            </button>
            <button
              type="button"
              className={`fz-filter-chip ${filtroCancha === "f5" ? "active" : ""}`}
              onClick={() => setFiltroCancha("f5")}
            >
              Fútbol 5
            </button>
            <button
              type="button"
              className={`fz-filter-chip ${filtroCancha === "f7" ? "active" : ""}`}
              onClick={() => setFiltroCancha("f7")}
            >
              Fútbol 7
            </button>
            <button
              type="button"
              className={`fz-filter-chip ${filtroCancha === "f11" ? "active" : ""}`}
              onClick={() => setFiltroCancha("f11")}
            >
              Fútbol 11
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="fz-btn-create-reto"
              onClick={clickBotonPublicar}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Icons.Plus size={15} />
              {mostrarForm ? "Cerrar Formulario" : "Publicar Convocatoria"}
            </button>

            {esAdmin && (
              <button
                type="button"
                className="fz-btn-reset-retos"
                onClick={reiniciarConvocatorias}
                title="Restaurar lista original de partidos abiertos"
              >
                Restaurar Cupos (Admin)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Formulario de Convocatoria */}
      {mostrarForm && usuario && (
        <form onSubmit={crearConvocatoria} className="fz-form-reto-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a" }}>
              Nueva Convocatoria de Partido
            </h3>
            <span style={{ fontSize: "12px", color: "#10b981", fontWeight: 700 }}>
              Organizador: {miNombreUsuario}
            </span>
          </div>

          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px" }}>
            Los demás usuarios podrán ver tu partido y sumarse a la nómina de inmediato.
          </p>

          <div className="fz-form-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div className="fz-field">
              <label>Cancha *</label>
              <select value={cancha} onChange={(e) => setCancha(e.target.value)}>
                <option value="Cancha Fútbol 5 (Central)">Cancha Fútbol 5 (Central - 10 Jugadores)</option>
                <option value="Cancha Fútbol 7 (Norte)">Cancha Fútbol 7 (Norte - 14 Jugadores)</option>
                <option value="Cancha Fútbol 11 (Sur)">Cancha Fútbol 11 (Sur - 22 Jugadores)</option>
              </select>
            </div>

            <div className="fz-field">
              <label>Fecha del Partido *</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>

            <div className="fz-field">
              <label>Horario *</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </div>

            <div className="fz-field">
              <label>Capacidad Total del Partido (Jugadores) *</label>
              <input
                type="number"
                min={2}
                max={22}
                value={cuposTotales}
                onChange={(e) => setCuposTotales(Number(e.target.value))}
                required
              />
            </div>

            <div className="fz-field">
              <label>Posición Buscada</label>
              <input
                type="text"
                placeholder="Ej: 1 Arquero, 2 Defensas"
                value={posicionBuscada}
                onChange={(e) => setPosicionBuscada(e.target.value)}
              />
            </div>

            <div className="fz-field">
              <label>Nivel de Juego</label>
              <select value={nivel} onChange={(e) => setNivel(e.target.value)}>
                <option value="Amistoso / Todos los niveles">Amistoso / Todos los niveles</option>
                <option value="Medio / Reto">Medio / Reto</option>
                <option value="Competitivo / Avanzado">Competitivo / Avanzado</option>
              </select>
            </div>
          </div>

          <div className="fz-field" style={{ marginTop: "12px" }}>
            <label>Mensaje para la comunidad</label>
            <textarea
              rows={2}
              placeholder="Detalles sobre el partido, hidratación, petos..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
            <button type="submit" className="fz-btn-primary">
              Publicar Convocatoria
            </button>
            <button type="button" className="fz-btn-outline" onClick={() => setMostrarForm(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Grid de Retos Activos */}
      <div className="fz-retos-grid">
        {convocatoriasFiltradas.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "#64748b" }}>
            <Icons.Users size={36} color="#94a3b8" />
            <strong style={{ display: "block", marginTop: "10px" }}>No hay convocatorias activas para esta categoría.</strong>
            <p style={{ margin: "6px 0 14px", fontSize: "13px" }}>Sé el primero en crear una convocatoria y armar tu partido.</p>
            <button type="button" className="fz-btn-primary" onClick={clickBotonPublicar}>
              Publicar Convocatoria
            </button>
          </div>
        ) : (
          convocatoriasFiltradas.map((c) => {
            const cuposRestantes = Math.max(0, c.cuposTotales - c.cuposOcupados);
            const lleno = cuposRestantes === 0;
            const yaUnido = miNombreUsuario && c.jugadoresUnidos.includes(miNombreUsuario);
            const esMiConvocatoria = (usuario && (c.organizadorEmail === usuario.email || c.organizador === miNombreUsuario)) || esAdmin;
            const porcentajeOcupado = Math.min(100, Math.round((c.cuposOcupados / c.cuposTotales) * 100));

            return (
              <div key={c.id} className={`fz-reto-card ${lleno ? "completo" : ""} ${yaUnido ? "unido" : ""}`}>
                <div className="fz-reto-card-top">
                  <span className="fz-reto-badge-cancha">{c.cancha}</span>
                  <span className={`fz-reto-status-pill ${lleno ? "full" : "open"}`}>
                    {lleno ? "Nómina Completa" : `${cuposRestantes} Cupos Libres`}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Organiza: {c.organizador}</h4>
                    <p className="fz-reto-datetime" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <Icons.Calendar size={12} color="#64748b" /> {c.fecha}
                      </span>
                      <span>·</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                        <Icons.Clock size={12} color="#64748b" /> {c.hora}
                      </span>
                    </p>
                  </div>

                  {esMiConvocatoria && (
                    <button
                      type="button"
                      className="fz-btn-delete-reto"
                      onClick={() => eliminarConvocatoria(c.id)}
                      title="Eliminar convocatoria"
                    >
                      <Icons.Trash size={16} color="#ef4444" />
                    </button>
                  )}
                </div>

                {/* BARRA DE PROGRESO DE CUPOS */}
                <div className="fz-cupos-progress-wrapper">
                  <div className="fz-cupos-labels">
                    <span>Nómina del Partido:</span>
                    <strong>{c.cuposOcupados} / {c.cuposTotales} Jugadores</strong>
                  </div>
                  <div className="fz-progress-bar-bg">
                    <div
                      className={`fz-progress-bar-fill ${lleno ? "full" : ""}`}
                      style={{ width: `${porcentajeOcupado}%` }}
                    ></div>
                  </div>
                </div>

                <div className="fz-reto-meta-box">
                  <div>
                    <span className="fz-meta-label">Buscamos:</span>
                    <strong>{c.posicionBuscada}</strong>
                  </div>
                  <div>
                    <span className="fz-meta-label">Nivel:</span>
                    <strong>{c.nivel}</strong>
                  </div>
                </div>

                <p className="fz-reto-desc">"{c.descripcion}"</p>

                {c.jugadoresUnidos.length > 0 && (
                  <div className="fz-reto-roster">
                    <span className="fz-meta-label">Jugadores Confirmados ({c.jugadoresUnidos.length}):</span>
                    <div className="fz-roster-tags">
                      {c.jugadoresUnidos.map((j, i) => (
                        <span key={i} className={`fz-player-tag ${j === miNombreUsuario ? "me" : ""}`}>
                          {j} {j === miNombreUsuario && " (Tú)"}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className={`fz-btn-join-reto ${yaUnido ? "joined" : lleno ? "disabled" : ""}`}
                  onClick={() => toggleUnirseAConvocatoria(c.id)}
                  disabled={lleno && !yaUnido}
                >
                  {yaUnido
                    ? "Inscrito (Clic para salir)"
                    : lleno
                    ? "Nómina Completa"
                    : "Unirme al Partido"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default TablonRetos;
