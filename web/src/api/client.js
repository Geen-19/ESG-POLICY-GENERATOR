import axios from "axios";

export const api = axios.create({
  baseURL: "/api", // proxy to your server
  headers: { "Content-Type": "application/json" },
});
