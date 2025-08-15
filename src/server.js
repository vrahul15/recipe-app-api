import express from "express";
import {ENV} from "./config/env.js";
import { favoriteTable } from "./db/schema.js";
import { db } from './config/db.js';
import { eq, and } from "drizzle-orm";
import job from"./config/cron.js";

// ...existing code...
const app = express();
const PORT = ENV.PORT || 5001;

if(ENV.NODE_ENV === "production") job.start();

app.use(express.json());

app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true });
});

app.post("/api/favorites", async (req, res) => {
   
    try {
         const { userId, recipeId, title, image, cookTime, servings } = req.body;

        if(!userId || !recipeId || !title) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const newFavorite = await db
        .insert(favoriteTable)
        .values({
                userId,
                recipeId,
                title,
                image,
                cookTime,
                servings,
        }).returning();
        res.status(201).json(newFavorite[0]);
    } catch (error) {
        console.log("Error creating favorite:", error);
        res.status(500).json({  error: "Internal Server Error" });
    }
});

app.get("/api/favorites/:userId", async (req, res) => {
    try{
        const {userId} = req.params;

       const userFavorite = await db.select().from(favoriteTable).where(eq(favoriteTable.userId, userId));
       res.status(200).json(userFavorite);
     } catch (error){
         console.log("Error fetching favorites:", error);
        res.status(500).json({  error: "Internal Server Error" });
     }
});

app.delete("/api/favorites/:userId/:recipeId", async (req, res) => { 
    try{
        const {userId, recipeId} = req.params;

        await db.delete(favoriteTable).where(
            and (eq(favoriteTable.userId, userId), eq(favoriteTable.recipeId, parseInt(recipeId)))
        );

        res.status(200).json({ message: "Favorite deleted successfully" });
    } catch (error) {
        console.log("Error deleting favorite:", error);
        res.status(500).json({  error: "Internal Server Error" });
    }
});


app.listen(PORT, () => {
    console.log("Server is running on port:", PORT);
});