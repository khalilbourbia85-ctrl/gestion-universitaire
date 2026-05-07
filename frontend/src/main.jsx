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

ReactDOM.createRoot(document.getElementById("root")).render(

<BrowserRouter>

<App />

</BrowserRouter>

);