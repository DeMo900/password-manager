import { Router } from "express";
import * as passwordController from "../controllers/password.controller";
import isAllowed from "../middlewares";

const router = Router();

router.get("/", isAllowed, passwordController.getIndex);
router.get("/vault", isAllowed, passwordController.getVault);
router.get("/vault/data", isAllowed, passwordController.getVaultData);
router.get("/search", isAllowed, passwordController.searchPasswords);
router.get("/showpassword/:id", isAllowed, passwordController.showPassword);
router.post("/generate", isAllowed, passwordController.generatePassword);
router.delete("/delete/:appName", isAllowed, passwordController.deletePassword);
router.delete("/clear", isAllowed, passwordController.clearPasswords);

export default router;
