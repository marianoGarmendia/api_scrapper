import { Router } from "express";
import { scrapZonaProp } from "../../zonaProps.js";

export const zonaPropRouter = Router();

zonaPropRouter.get("/", async (req, res) => {
  //   const search = req.body;
  try {
    const scrapProps = await scrapZonaProp();
    res.json({ scrapProps });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
