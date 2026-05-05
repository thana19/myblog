import "dotenv/config";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@react-router/express";

const app = express();
app.disable("x-powered-by");
app.use(compression());
app.use(morgan(process.env.NODE_ENV === "production" ? "tiny" : "dev"));

app.use(
  "/assets",
  express.static("build/client/assets", { immutable: true, maxAge: "1y" })
);
app.use(express.static("build/client", { maxAge: "1h" }));

const build = await import("./build/server/index.js");

app.all(
  "*",
  createRequestHandler({
    build,
    getLoadContext: () => ({}),
  })
);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`✓ myblog listening on http://localhost:${port}`);
});
