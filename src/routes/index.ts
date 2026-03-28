import { Router } from "express";
import passwordRoutes from "./password.routes";
import authRoutes from "./auth.routes";
import oauthRoutes from "./oauth.routes";

const router = Router();

router.use("/", passwordRoutes);
router.use("/", authRoutes);
router.use("/", oauthRoutes);

export default router;
