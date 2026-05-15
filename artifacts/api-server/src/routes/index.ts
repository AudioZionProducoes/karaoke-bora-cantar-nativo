import { Router, type IRouter } from "express";
import healthRouter from "./health";
import musicasRouter from "./musicas";
import usersRouter from "./users";
import webhookRouter from "./webhook";
import videoRouter from "./video";
import sessionsRouter from "./sessions";

const router: IRouter = Router();

router.use(healthRouter);
router.use(musicasRouter);
router.use(usersRouter);
router.use(webhookRouter);
router.use(videoRouter);
router.use(sessionsRouter);

export default router;
