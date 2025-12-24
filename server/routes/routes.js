import UserRouter from "./userRoutes.js";
import adminRoutes from './adminRoutes.js';
import orderRoutes from './orderRoutes.js';
import productRoutes from './productRoutes.js'; // Đảm bảo đã có dòng này
import customerRoutes from './customerRoutes.js'; 

const routes = (app) => {
  app.use("/api/user", UserRouter);
  app.use("/api/admin", adminRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/products', productRoutes); // Route cho sản phẩm
  app.use('/api/customers', customerRoutes);
  
};

export default routes;