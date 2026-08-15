import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    registerSchema,
    type RegisterFormData,
} from "../../utils/auth.schema";

import * as authService from "../../services/auth.service";

const RegisterPage = () => {

    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (
        data: RegisterFormData
    ) => {

        try {

            await authService.Register(data);

            alert("Registration successful. Please log in.");

            navigate("/login");

        } catch (error) {

            console.error(error);

            console.error(
                "Registration Error:",
                error
            );

            alert(
                "Registration failed. Check the browser console."
            );
        }
    };

    return (

        <form onSubmit={handleSubmit(onSubmit)}>

            <h1>Register</h1>

            <input
                type="text"
                placeholder="Name"
                {...register("name")}
            />

            <p>
                {errors.name?.message}
            </p>


            <input
                type="email"
                placeholder="Email"
                {...register("email")}
            />

            <p>
                {errors.email?.message}
            </p>


            <input
                type="password"
                placeholder="Password"
                {...register("password")}
            />

            <p>
                {errors.password?.message}
            </p>


            <button type="submit">
                Register
            </button>

        </form>
    );
};

export default RegisterPage;