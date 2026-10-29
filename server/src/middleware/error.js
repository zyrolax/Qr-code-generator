// 404 for anything that didn't match a route.
export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

// Central error handler. Keep internal details out of the client response but
// log them on the server for debugging.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  console.error(err);

  // Duplicate key (e.g. email already registered).
  if (err?.code === 11000) {
    return res.status(409).json({ error: "Already exists" });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.publicMessage || "Something went wrong" });
}

// Small helper to throw errors with an HTTP status + a safe client message.
export function httpError(status, publicMessage) {
  const e = new Error(publicMessage);
  e.status = status;
  e.publicMessage = publicMessage;
  return e;
}
