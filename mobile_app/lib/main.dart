import 'package:flutter/material.dart';
import 'login_screen.dart'; // Đảm bảo bạn đã tạo file login_screen.dart

void main() {
  // Đảm bảo các dịch vụ của Flutter được khởi tạo trước khi chạy app
  WidgetsFlutterBinding.ensureInitialized();
  
  runApp(const BizFlowApp());
}

class BizFlowApp extends StatelessWidget {
  const BizFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BizFlow Mobile',
      theme: ThemeData(
        // Màu sắc chủ đạo của BizFlow (Xanh dương doanh nghiệp)
        primarySwatch: Colors.blue,
        useMaterial3: true,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      // Chạy màn hình đăng nhập đầu tiên
      home: LoginScreen(),
      // Tắt biểu tượng "Debug" ở góc màn hình
      debugShowCheckedModeBanner: false,
    );
  }
}