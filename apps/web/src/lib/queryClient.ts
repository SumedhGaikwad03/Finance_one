import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({ // this intaialise the cache object so everyapi call and data is 
    // stroed in this object 

    defaultOptions: {

        queries: {

            retry: 1,

            refetchOnWindowFocus: false,

            staleTime: 1000 * 60,

        },

    },

});