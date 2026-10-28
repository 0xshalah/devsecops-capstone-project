import { useCallback, useEffect, useState } from "react";
import { gatewayApi } from "../services/gatewayApi";

const useAsync = (fn, deps) => {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      setState({ data: await fn(), loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error });
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
};

export const useOverview = () => useAsync(() => gatewayApi.getOverview(), []);

export const useLogs = (params) => useAsync(() => gatewayApi.listLogs(params), [JSON.stringify(params)]);

export const useKeys = (env, version) => {
  const q = useAsync(() => gatewayApi.listKeys(env), [env, version]);
  const revoke = async (id) => { await gatewayApi.revokeKey(id); await q.reload(); };
  const remove = async (id) => { await gatewayApi.deleteKey(id); await q.reload(); };
  return { ...q, revoke, remove };
};
