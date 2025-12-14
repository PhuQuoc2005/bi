import UserRouter from "./userRoutes.js";

const routes = (app) => {
  app.use("/api/user", UserRouter);
};

export default routes;