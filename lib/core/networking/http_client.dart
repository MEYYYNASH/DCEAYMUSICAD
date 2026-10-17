import 'package:dio/dio.dart';

class DCEAYHttpClient {
  static final DCEAYHttpClient _instance = DCEAYHttpClient._internal();
  factory DCEAYHttpClient() => _instance;

  late final Dio dio;

  DCEAYHttpClient._internal() {
    final baseOptions = BaseOptions(
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'User-Agent': 'DCEAY-Music-Android/2.1.0',
        'Accept': 'application/json, text/plain, */*',
      },
    );

    dio = Dio(baseOptions);
  }

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onReceiveProgress,
  }) async {
    return dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
      cancelToken: cancelToken,
      onReceiveProgress: onReceiveProgress,
    );
  }

  Future<Response> download(
    String urlPath,
    dynamic savePath, {
    ProgressCallback? onReceiveProgress,
    CancelToken? cancelToken,
    Options? options,
  }) async {
    return dio.download(
      urlPath,
      savePath,
      onReceiveProgress: onReceiveProgress,
      cancelToken: cancelToken,
      options: options,
    );
  }
}
