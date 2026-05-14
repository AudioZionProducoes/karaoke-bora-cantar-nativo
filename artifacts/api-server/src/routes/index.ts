import { Router, type IRouter } from "express";
import healthRouter from "./health";
import musicasRouter from "./musicas";
import usersRouter from "./users";
import webhookRouter from "./webhook";
import videoRouter from "./video";

const router: IRouter = Router();

router.use(healthRouter);
router.use(musicasRouter);
router.use(usersRouter);
router.use(webhookRouter);
router.use(videoRouter);

export default router;
