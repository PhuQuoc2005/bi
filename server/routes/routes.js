import UserRouter from "./userRoutes.js";
import adminRoutes from './adminRoutes.js';

const routes = (app) => {
  app.use("/api/user", UserRouter);
  app.use("/api/admin", adminRoutes);
};

export default routes;