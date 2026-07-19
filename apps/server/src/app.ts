import express from "express";
import healthRouter from "./routes/health.routes";
import userRouter from "./routes/user.routes";

const app = express();




app.use(express.json());

app.use(healthRouter);
app.use("/api/users", userRouter);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Finance API is running",
    version: "1.0.0",
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Finance API is running",
    version: "1.0.0",
  });
});

export default app;