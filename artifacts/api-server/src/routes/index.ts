import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import storeRouter from "./store.js";
import usersRouter from "./users.js";
import ticketsRouter from "./tickets.js";
import serverRouter from "./server.js";
import adminRouter from "./admin.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/store", storeRouter);
router.use("/users", usersRouter);
router.use("/tickets", ticketsRouter);
router.use(serverRouter);
router.use("/admin", adminRouter);

export default router;
