import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import { BrowserRouter } from "react-router-dom";

import "./index.css";
import axios from "axios";

// Token is now managed only in memory
// const token = localStorage.getItem("token");
// if (token) {
//   axios.defaults.headers.common['Authorization'] = `Token ${token}`;
// }

// Set dynamic base URL for production or fallback to localhost for development
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

ReactDOM.createRoot(document.getElementById("root")).render(

<BrowserRouter>

<App />

</BrowserRouter>

);