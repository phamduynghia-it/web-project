import fs from "fs/promises";
import path from "path";
import BuilderClient from "./BuilderClient";

export default async function BuilderPage({ params }) {
  const { id: templateId } = await params;
  
  // Read config.json
  const configPath = path.join(process.cwd(), "templates", templateId, "config.json");
  let config;
  try {
    const configData = await fs.readFile(configPath, "utf-8");
    config = JSON.parse(configData);
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <p>Template không tồn tại hoặc bị lỗi cấu hình.</p>
      </div>
    );
  }

  return <BuilderClient templateId={templateId} config={config} />;
}
