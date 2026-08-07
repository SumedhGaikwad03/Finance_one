import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    loginSchema,
    type LoginFormData,
} from "../../utils/auth.schema";

import * as authService from "../../services/auth.service";

const LoginPage = () => {

    const navigate = useNavigate();

    const {
// here we are doing object decontructing for using data and validation 
        register,

        handleSubmit,

        formState: { errors },  //instted of const errors = form.formState.errors; we can by pass it fully 

        //ts intailes all these values behiend the seane no need to explicitly stating the values for us
        // as register=from.regieter (in the backend already )

    } = useForm<LoginFormData>({

        resolver: zodResolver(loginSchema),

    });

    const onSubmit = async (
        data: LoginFormData
    ) => {

        try {

            const response =
                await authService.login(data);

            localStorage.setItem(
                "token",
                response.token
            );

            navigate("/dashboard");

        } catch (error) {

            console.error(error);

             console.error("Login Error:", error);
             alert("Login failed. Check the browser console.");

        }

    };

    return (

        <form onSubmit={handleSubmit(onSubmit)}>

            <h1>Login</h1>

            <input
                type="email"
                placeholder="Email"
                {...register("email")}
            />

            <p>{errors.email?.message}</p>

            <input
                type="password"
                placeholder="Password"
                {...register("password")}
            />

            <p>{errors.password?.message}</p>

            <button type="submit">

                Login

            </button>

        </form>

    );

};

export default LoginPage;