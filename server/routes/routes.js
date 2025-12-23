import UserRouter from "./userRoutes.js";
import adminRoutes from './adminRoutes.js';
import orderRoutes from './orderRoutes.js';

const routes = (app) => {
  app.use("/api/user", UserRouter);
  app.use("/api/admin", adminRoutes);
  app.use('/api/orders', orderRoutes);
};

export default routes;