import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.routes";
import userRouter from "./routes/user.routes";
import authRouter from "./routes/auth.routes";
import transactionRouter from "./routes/transation.routes";
import { errorMiddleware } from "./middleware/error.middleware";
import budgetRoutes from "./routes/budget.routes";
import dashboardRoutes from "./routes/dashboard.routes";


const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);


app.use(express.json());

app.use(healthRouter);
app.use("/api/users", userRouter);
app.use("/api/auth",authRouter); 
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/budgets", budgetRoutes);

app.use("/api/transactions", transactionRouter); // this is the route for the transaction controller which is used for creating 
// transactions
// this is the routes for the auth controller which is used for user registration and login

app.use(errorMiddleware); // this is the error middleware which catches erreos when tthey bubble up 

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Finance API is running",
    version: "1.0.0",
  });
});

app.use(errorMiddleware); // this is the error middleware which catches erreos when tthey bubble up 

// This is the staring point for our backend in the system as this is where the backend logic starts and we use index.ts to listen 
// to the port and then we use app.ts to create the express app .
//


export default app;