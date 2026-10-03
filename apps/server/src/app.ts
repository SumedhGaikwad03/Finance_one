import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes";
import userRouter from "./routes/user.routes";
import authRouter from "./routes/auth.routes";
import transactionRouter from "./routes/transation.routes";
import budgetRoutes from "./routes/budget.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();

const rawAllowedOrigins =
  process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN;

const allowedOrigins = rawAllowedOrigins
  ? rawAllowedOrigins.split(",").map((url) => url.trim())
  : ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, server-to-server health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation: origin not allowed"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Base API Metadata & Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Finance API is running",
    version: "1.0.0",
  });
});

app.use(healthRouter);

// Domain API Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/transactions", transactionRouter);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Centralized Error Handling Middleware (must be registered after all routes)
app.use(errorMiddleware);

export default app;