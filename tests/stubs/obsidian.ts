// Minimal runtime stub of the `obsidian` module for unit tests. Only the
// symbols imported by the modules under test need to exist here; the real
// implementations are provided by Obsidian at runtime.
export const requestUrl = async () => ({ status: 200, json: {} });
