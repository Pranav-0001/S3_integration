import express from "express";
import { uploadToAws } from "../controller/S3_Controller.js";


const router = express.Router();

router.post("/", uploadToAws);

export default router;
