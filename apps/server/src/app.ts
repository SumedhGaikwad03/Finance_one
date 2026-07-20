import express from "express";
import healthRouter from "./routes/health.routes";
import userRouter from "./routes/user.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app = express();




app.use(express.json());

app.use(healthRouter);
app.use("/api/users", userRouter);

app.use(errorMiddleware);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Finance API is running",
    version: "1.0.0",
  });
});



export default app;