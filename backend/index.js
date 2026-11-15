import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

import passport from "passport";
import session from "express-session";
import connectMongo from "connect-mongodb-session";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { buildContext } from "graphql-passport";

import mergedResolvers from "./resolvers/index.js";
import mergedTypeDefs from "./typeDefs/index.js";

import { connectDB } from "./db/connectDB.js";
import { configurePassport } from "./passport/passport.config.js";
import path from "path";
import { parse, Kind } from "graphql";

dotenv.config();
if (!process.env.MONGO_URI || !process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("MONGO_URI and SESSION_SECRET (at least 32 characters) are required");
}
configurePassport();
const production = process.env.NODE_ENV === "production";
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "http://localhost:3000")
  .split(",").map(value => value.trim()).filter(Boolean);
if (production && !process.env.FRONTEND_ORIGINS) {
  throw new Error("Set FRONTEND_ORIGINS in production");
}
const __dirname = path.resolve();
const app = express();
// Set only behind a trusted reverse proxy that overwrites forwarding headers.
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
const httpServer = http.createServer(app);

const MongoDBStore = connectMongo(session);

const store = new MongoDBStore({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

store.on("error", (err) => console.error("Session store error:", err));

app.use(
  session({
    name: "spendwise.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      sameSite: "lax",
      secure: production,
    },
    store: store,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
  introspection: !production,
  csrfPrevention: true,
  includeStacktraceInErrorResponses: !production,
  typeDefs: mergedTypeDefs,
  resolvers: mergedResolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

// Ensure we wait for our server to start
await server.start();

// Require a trusted Origin on browser/API POSTs. SameSite cookies alone are not CSRF protection.
// This deliberately rejects Origin-less scripts; add a separate authenticated API mechanism if needed.
const requireTrustedOrigin = (req, res, next) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
  const origin = req.get("origin");
  if (!origin || !allowedOrigins.includes(origin)) return res.status(403).json({ error: "Forbidden origin" });
  next();
};

// Single-process safety limits. For multiple replicas, use a shared store (e.g. Redis).
const authAttempts = new Map();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT = 10; // per IP per 15 minutes, for login and signup combined
const MAX_GRAPHQL_DEPTH = 12;
const MAX_FIELDS = 120;

function graphqlGuard(req, res, next) {
  const query = req.body?.query;
  if (typeof query !== "string" || !query.trim()) return res.status(400).json({ error: "GraphQL query required" });
  let document;
  try { document = parse(query); } catch { return res.status(400).json({ error: "Invalid GraphQL query" }); }
  const fragments = new Map(document.definitions.filter(d => d.kind === Kind.FRAGMENT_DEFINITION).map(d => [d.name.value, d]));
  let fieldCount = 0;
  let maxDepth = 0;
  let authMutation = false;
  let invalid = false;
  function inspect(selectionSet, depth, activeFragments, rootMutation = false) {
    if (!selectionSet || invalid) return;
    maxDepth = Math.max(maxDepth, depth);
    if (maxDepth > MAX_GRAPHQL_DEPTH) { invalid = true; return; }
    for (const selection of selectionSet.selections) {
      if (selection.kind === Kind.FIELD) {
        fieldCount++;
        if (fieldCount > MAX_FIELDS) { invalid = true; return; }
        if (rootMutation && ["login", "signUp"].includes(selection.name.value)) authMutation = true;
        inspect(selection.selectionSet, depth + 1, activeFragments, false);
      } else if (selection.kind === Kind.INLINE_FRAGMENT) {
        inspect(selection.selectionSet, depth, activeFragments, rootMutation);
      } else if (selection.kind === Kind.FRAGMENT_SPREAD) {
        const name = selection.name.value;
        if (activeFragments.has(name)) { invalid = true; return; }
        const fragment = fragments.get(name);
        if (fragment) inspect(fragment.selectionSet, depth, new Set([...activeFragments, name]), rootMutation);
      }
      if (invalid) return;
    }
  }
  const operations = document.definitions.filter(d => d.kind === Kind.OPERATION_DEFINITION);
  if (operations.length !== 1) return res.status(400).json({ error: "Exactly one GraphQL operation required" });
  inspect(operations[0].selectionSet, 1, new Set(), operations[0].operation === "mutation");
  if (invalid) return res.status(400).json({ error: "GraphQL query exceeds safety limits" });
  if (authMutation) {
    const now = Date.now();
    // Bound memory without background timers.
    if (authAttempts.size > 10000) {
      for (const [key, record] of authAttempts) if (now - record.started >= AUTH_WINDOW_MS) authAttempts.delete(key);
      if (authAttempts.size > 10000) authAttempts.clear();
    }
    const key = req.ip;
    let record = authAttempts.get(key);
    if (!record || now - record.started >= AUTH_WINDOW_MS) record = { started: now, count: 0 };
    record.count++;
    authAttempts.set(key, record);
    if (record.count > AUTH_LIMIT) {
      res.set("Retry-After", String(Math.ceil((AUTH_WINDOW_MS - (now - record.started)) / 1000)));
      return res.status(429).json({ error: "Too many authentication attempts. Try again later." });
    }
  }
  next();
}

app.use(
  "/graphql",
  cors({ origin: allowedOrigins, credentials: true }),
  express.json({ limit: "100kb" }),
  requireTrustedOrigin,
  graphqlGuard,
  expressMiddleware(server, { context: async ({ req, res }) => buildContext({ req, res }) })
);

// npm run build will build your frontend app, and it will optimized version of your app
app.use(express.static(path.join(__dirname, "frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/dist", "index.html"));
});

// Modified server startup
await connectDB();
await new Promise((resolve) => httpServer.listen({ port: Number(process.env.PORT) || 4000 }, resolve));

console.log(`Server ready on port ${Number(process.env.PORT) || 4000}`);
