import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import datasetRouter from "./dataset";
import retrievalRouter from "./retrieval";
import historyRouter from "./history";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(datasetRouter);
router.use(retrievalRouter);
router.use(historyRouter);
router.use(adminRouter);

export default router;
