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

// This is the staring point for our backend in the system as this is where the backend logic starts and we use index.ts to listen 
// to the port and then we use app.ts to create the express app .
//


export default app;