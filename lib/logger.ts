type Fields = Record<string, unknown>;
function write(level: "info" | "warn" | "error", message: string, fields: Fields = {}) {
  const safe = Object.fromEntries(Object.entries(fields).filter(([key]) => !/password|secret|token|database_url/i.test(key)));
  console[level](JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...safe }));
}
export const logger = { info: (m: string, f?: Fields) => write("info", m, f), warn: (m: string, f?: Fields) => write("warn", m, f), error: (m: string, f?: Fields) => write("error", m, f) };
