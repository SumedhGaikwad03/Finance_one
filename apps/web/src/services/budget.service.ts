// here we define the service that is responsible for our budgets page working 
import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import * as budgetInterface from "../types/budget.types";

// all  the imports are created now 

// defineing a endpoint to get active budget 

export const getActiveBudget = async ()=> {

    const response = await api.get<budgetInterface.Budget>(
        ENDPOINTS.BUDGETS.ACTIVE 
    )

    return response.data; 
}
    
// this is our first end point 

// now to get all the budgets the user has 

export const getMyBudgets = async () => {

    const response = await api.get <budgetInterface.Budget[]> (
        ENDPOINTS.BUDGETS.ROOT
    )
    return response.data; 

}

// the the main dish as create budget which is why we defined our interface 

export const createBudget = async ( data : budgetInterface.BudgetCreationRequest) => {

    const response = api.post( 
        ENDPOINTS.BUDGETS.ROOT,
        data
    ) // we obv need to send data or else the post endpoint would not mean a thing !! 


    return (await response).data; 
}


// this is the function to update budget 

export const updateBudget = async ( id : number , data : Partial<budgetInterface.BudgetCreationRequest>) : Promise<budgetInterface.Budget>  => {

const response = await api.patch(
    `${ENDPOINTS.BUDGETS.ROOT}/${id}`,
    data
)
return response.data;
}

// this is a function to delete the budget 

export const deleteBudget = async ( id: number ) :Promise<void> => {

    await api.delete(
        `${ENDPOINTS.BUDGETS.ROOT}/${id}`
    )
 // now need to returna and save data for this 

}
// the next code snippet is to lock an budget 

export const lockBudget = async ( id : number ) :Promise<budgetInterface.Budget> => {

    const response = await api.patch(
        `${ENDPOINTS.BUDGETS.ROOT}/${id}/lock`
    )

    return response.data; 
}




