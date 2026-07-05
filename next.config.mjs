/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cấu hình bắt buộc khi deploy lên Vercel:
  // Vercel mặc định bỏ qua các thư mục không được import trực tiếp trong code (như thư mục templates).
  // Ta phải ép Vercel mang theo thư mục templates vào serverless function của API deploy.
  outputFileTracingIncludes: {
    '/api/deploy': ['./templates/**/*'],
  }
};

export default nextConfig;
