import { treaty } from '@elysiajs/eden'
import type { App } from 'app'
import { createContext, useContext } from 'react';
import { API_URL } from '@/config';

const client = treaty<App>(API_URL, {
    fetch: {
        credentials: 'include'
    }
});

const ElysiaClientContext = createContext(client);

export const ElysiaClientContextProvider = ElysiaClientContext.Provider;
export const useElysiaClient = () => {
    const client = useContext(ElysiaClientContext);
    return client;
}
