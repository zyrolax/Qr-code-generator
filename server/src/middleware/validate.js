// Wraps a zod schema as Express middleware. On success the parsed (and thus
// sanitized/typed) data replaces req.body. On failure we return 400 with a
// readable list of issues.
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({ error: "Invalid input", details });
    }
    req.body = result.data;
    next();
  };
}
