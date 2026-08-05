import { Request , Response , NextFunction} from "express";
import * as dashboardService from "../services/dashboard.service";

// all the imports are completed 

export const getDashboard = async ( 

    req: Request , 
    res : Response ,
    next :NextFunction
) => {
 const userId = req.user.userId;

 const dashboard = 
  await dashboardService.getDashboardData(userId);
  res.status(200).json(dashboard);
};
