import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import { BrowserRouter } from "react-router-dom";

import "./index.css";
import axiosInstance from "./utils/axiosConfig.js";

// Restore token if it exists in localStorage
const token = localStorage.getItem("token");
if (token) {
  axiosInstance.defaults.headers.common['Authorization'] = `Token ${token}`;
}

ReactDOM.createRoot(document.getElementById("root")).render(

<BrowserRouter>

<App />

</BrowserRouter>

);