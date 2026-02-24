import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";

import geminiRoutes from "./routes/geminiRoute";



const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }))

app.use("/api/gemini", geminiRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log("Loaded API:", process.env.API_KEY);

  console.log("Server running...");
});
