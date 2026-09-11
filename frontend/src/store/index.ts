import { configureStore } from "@reduxjs/toolkit";
import dbMetricsReducer from "./slices/dbMetricsSlice";

export const store = configureStore({
  reducer: {
    dbMetrics: dbMetricsReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
