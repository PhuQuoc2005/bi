import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  final String baseUrl = "http://192.168.229.27:5000/api";
  final Dio _dio = Dio();
  final _storage = const FlutterSecureStorage();

  Future<Map<String, dynamic>?> login(String phoneNumber, String password) async {
    try {
      final response = await _dio.post(
        '$baseUrl/user/login',
        data: {
          'phone_number': phoneNumber,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        // Lưu thông tin người dùng hoặc Token vào máy (nếu server trả về token)
        await _storage.write(key: 'user_id', value: response.data['id'].toString());
        return response.data;
      }
    } on DioException catch (e) {
      print("Lỗi đăng nhập: ${e.response?.data['message'] ?? e.message}");
      rethrow;
    }
    return null;
  }
}