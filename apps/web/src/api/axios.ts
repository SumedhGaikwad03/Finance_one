import axios from "axios";

const api = axios.create({

    baseURL: import.meta.env.VITE_API_URL, // points to the backend sever api 

    headers: {
        "Content-Type": "application/json",
    },

});

api.interceptors.request.use( // this essentially translates  to as before every req leaves the browser to the following

    (config) => {

        const token = localStorage.getItem("token");

        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;
        // attach auth header to every request 
        }

        return config; // pass the req ahead as all work we had to do was done 

    }

);

export default api;