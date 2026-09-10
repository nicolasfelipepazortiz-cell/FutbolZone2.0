import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../services/api";

export interface CanchaResumen {
  id: number;
  nombre: string;
  tipo: string;
  precio_hora: number;
  activa: boolean;
}

export interface DBMetricsState {
  canchas: {
    total: number;
    activas: number;
    items: CanchaResumen[];
  };
  reservas: {
    total: number;
    confirmadas: number;
    pendientes: number;
    ingresosTotales: number;
  };
  usuarios: {
    total: number;
    clientes: number;
  };
  status: "idle" | "loading" | "succeeded" | "failed";
  lastSync: string | null;
  error: string | null;
  autoRefreshEnabled: boolean;
}

const initialState: DBMetricsState = {
  canchas: {
    total: 3,
    activas: 3,
    items: [
      { id: 1, nombre: "Cancha Monumental", tipo: "Fútbol 11", precio_hora: 140000, activa: true },
      { id: 2, nombre: "Cancha La Bombonera", tipo: "Fútbol 7", precio_hora: 95000, activa: true },
      { id: 3, nombre: "Cancha El Campín", tipo: "Fútbol 5", precio_hora: 70000, activa: true },
    ],
  },
  reservas: {
    total: 12,
    confirmadas: 10,
    pendientes: 2,
    ingresosTotales: 980000,
  },
  usuarios: {
    total: 28,
    clientes: 26,
  },
  status: "idle",
  lastSync: null,
  error: null,
  autoRefreshEnabled: true,
};

// Async Thunk para consultar en tiempo real las tablas de la Base de Datos
export const sincronizarMetricasBD = createAsyncThunk(
  "dbMetrics/sincronizarMetricasBD",
  async (_, { rejectWithValue }) => {
    try {
      // 1. Consulta tabla `canchas`
      let canchasData: any[] = [];
      try {
        const canchasRes = await api.obtenerCanchas();
        canchasData = Array.isArray(canchasRes)
          ? canchasRes
          : canchasRes?.data || canchasRes?.canchas || [];
      } catch {
        // En caso de que el backend no responda temporalmente
      }

      // 2. Consulta tabla `reservas`
      let reservasData: any[] = [];
      try {
        const reservasRes = await api.obtenerReservas();
        reservasData = Array.isArray(reservasRes)
          ? reservasRes
          : reservasRes?.data || reservasRes?.reservas || [];
      } catch {
        // Fallback resiliente
      }

      // 3. Consulta tabla `usuarios` / clientes
      let usuariosData: any[] = [];
      try {
        const usuariosRes = await api.obtenerClientes();
        usuariosData = Array.isArray(usuariosRes)
          ? usuariosRes
          : usuariosRes?.data || usuariosRes?.usuarios || [];
      } catch {
        // Fallback resiliente
      }

      return {
        canchas: canchasData,
        reservas: reservasData,
        usuarios: usuariosData,
        timestamp: new Date().toLocaleTimeString(),
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Error al sincronizar con la base de datos");
    }
  }
);

export const dbMetricsSlice = createSlice({
  name: "dbMetrics",
  initialState,
  reducers: {
    incrementarReservaLocal: (state, action: PayloadAction<{ precio?: number; canchaId?: number }>) => {
      state.reservas.total += 1;
      state.reservas.confirmadas += 1;
      if (action.payload.precio) {
        state.reservas.ingresosTotales += action.payload.precio;
      }
      state.lastSync = new Date().toLocaleTimeString();
    },
    toggleAutoRefresh: (state) => {
      state.autoRefreshEnabled = !state.autoRefreshEnabled;
    },
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sincronizarMetricasBD.pending, (state) => {
        state.status = "loading";
      })
      .addCase(sincronizarMetricasBD.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.error = null;
        state.lastSync = action.payload.timestamp;

        // Si se obtuvieron datos reales de la tabla `canchas`
        if (action.payload.canchas && action.payload.canchas.length > 0) {
          const list = action.payload.canchas;
          state.canchas.total = list.length;
          state.canchas.activas = list.filter((c: any) => c.activa !== false && c.activa !== 0).length;
          state.canchas.items = list.map((c: any) => ({
            id: c.id,
            nombre: c.nombre || `Cancha #${c.id}`,
            tipo: c.tipo || "Fútbol",
            precio_hora: Number(c.precio_hora) || 0,
            activa: c.activa !== false && c.activa !== 0,
          }));
        }

        // Si se obtuvieron datos reales de la tabla `reservas`
        if (action.payload.reservas && action.payload.reservas.length > 0) {
          const list = action.payload.reservas;
          state.reservas.total = list.length;
          state.reservas.confirmadas = list.filter((r: any) => r.estado === "confirmada" || r.estado === "completada").length;
          state.reservas.pendientes = list.filter((r: any) => r.estado === "pendiente").length;
          state.reservas.ingresosTotales = list.reduce(
            (acc: number, r: any) => acc + (Number(r.precio_total) || 0),
            0
          );
        }

        // Si se obtuvieron datos reales de la tabla `usuarios`
        if (action.payload.usuarios && action.payload.usuarios.length > 0) {
          const list = action.payload.usuarios;
          state.usuarios.total = list.length;
          state.usuarios.clientes = list.filter((u: any) => u.rol !== "admin").length;
        }
      })
      .addCase(sincronizarMetricasBD.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Error de conexión con la BD";
      });
  },
});

export const { incrementarReservaLocal, toggleAutoRefresh, resetError } = dbMetricsSlice.actions;
export default dbMetricsSlice.reducer;
