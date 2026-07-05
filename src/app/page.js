import fs from "fs/promises";
import path from "path";
import HomeClient from "./HomeClient";

export default async function Home() {
  const templatesDir = path.join(process.cwd(), "templates");
  const templates = [];

  try {
    const folders = await fs.readdir(templatesDir);
    
    for (const folder of folders) {
      const configPath = path.join(templatesDir, folder, "config.json");
      try {
        const configData = await fs.readFile(configPath, "utf-8");
        const config = JSON.parse(configData);
        templates.push(config);
      } catch (err) {
        // Bỏ qua nếu folder không có config.json hợp lệ
      }
    }
  } catch (error) {
    console.error("Lỗi đọc thư mục templates:", error);
  }

  return <HomeClient templates={templates} />;
}
