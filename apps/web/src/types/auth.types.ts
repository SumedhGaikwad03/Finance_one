export interface LoginRequest {

    email : string ;
    password : string ;
}

export interface LoginResponse {

    token : string ;
}

export interface RegisterRequest{
    name : string ;
    email : string ;
    password : string;
}

export interface RegisterResponse{

    message : string ; 
}
 // these are interfaces qwe use to not define inputs over and over again 