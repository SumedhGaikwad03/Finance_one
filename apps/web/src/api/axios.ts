import axios from "axios";

const api = axios.create({

    baseURL: import.meta.env.VITE_API_URL, // the is a place holder for backend ui 

    headers: {
        "Content-Type": "application/json",
    },

});

api.interceptors.request.use( // this essentially translaes to as before every req leaves the browser to the foolwing 

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