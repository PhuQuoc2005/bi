import 'package:flutter/material.dart';
import 'login_screen.dart';

class DashboardScreen extends StatelessWidget {
  final String userName;

  const DashboardScreen({Key? key, required this.userName}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text("BizFlow Dashboard"),
        backgroundColor: Colors.blueAccent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              // Lệnh quay về màn hình Đăng nhập
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => LoginScreen()),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Phần Header chào hỏi
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: Colors.blueAccent,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(30),
                bottomRight: Radius.circular(30),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Xin chào,",
                  style: TextStyle(color: Colors.white70, fontSize: 16),
                ),
                Text(
                  userName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  "Hôm nay bạn muốn quản lý gì?",
                  style: TextStyle(color: Colors.white, fontSize: 14),
                ),
              ],
            ),
          ),

          // Phần Menu chính dạng Grid
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: GridView.count(
                crossAxisCount: 2, // 2 cột
                crossAxisSpacing: 15,
                mainAxisSpacing: 15,
                children: [
                  _buildMenuCard(context, "Đơn hàng", Icons.shopping_cart, Colors.orange),
                  _buildMenuCard(context, "Sản phẩm", Icons.inventory_2, Colors.green),
                  _buildMenuCard(context, "Công nợ", Icons.account_balance_wallet, Colors.red),
                  _buildMenuCard(context, "Khách hàng", Icons.people, Colors.purple),
                  _buildMenuCard(context, "Báo cáo", Icons.bar_chart, Colors.blue),
                  _buildMenuCard(context, "AI Assistant", Icons.psychology, Colors.indigo),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Hàm hỗ trợ tạo các ô Menu
  Widget _buildMenuCard(BuildContext context, String title, IconData icon, Color color) {
    return InkWell(
      onTap: () {
        // Sau này bạn sẽ viết logic chuyển trang tại đây
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Đang mở: $title")),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.2),
              spreadRadius: 2,
              blurRadius: 5,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 10),
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}