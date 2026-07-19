console.log("My Vite Env Variable is:", import.meta.env.VITE_API_URL);
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';