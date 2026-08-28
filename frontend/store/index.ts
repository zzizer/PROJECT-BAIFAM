import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  createMigrate,
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import type { PersistedState } from "redux-persist";
import authReducer from "./slices/authSlice";

const createNoopStorage = () => ({
  getItem: (_key: string) => Promise.resolve(null),
  setItem: (_key: string, value: unknown) => Promise.resolve(value),
  removeItem: (_key: string) => Promise.resolve(),
});

const storage =
  typeof window !== "undefined"
    ? require("redux-persist/lib/storage").default
    : createNoopStorage();

const migrations = {
  1: (state: PersistedState): PersistedState => {
    if (!state) return state;

    const safeState = {
      ...state,
    } as PersistedState & Record<string, unknown>;

    delete safeState.accessToken;
    delete safeState.refreshToken;

    return safeState;
  },
};

const rootReducer = combineReducers({
  auth: persistReducer(
    {
      key: "auth",
      version: 1,
      storage,
      whitelist: ["user", "isAuthenticated"],
      migrate: createMigrate(migrations, { debug: false }),
    },
    authReducer,
  ),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export const persistor = persistStore(store);
