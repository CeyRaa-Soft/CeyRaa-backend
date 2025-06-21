import { Express } from "express";
import * as path from "path";
import * as fs from "fs";

export const loadRouters = (app: Express): void => {
  try {
    const distRoot = path.resolve(__dirname, "../..");
    const modulesDir = path.join(distRoot, "modules");

    const isDevelopment = __filename.endsWith(".ts");
    const env = isDevelopment ? "development (tsx)" : "production (compiled)";
    const routerExtension = isDevelopment ? "router.ts" : "router.js";

    console.log(`📍 Environment: ${env}`);

    if (!fs.existsSync(modulesDir)) {
      console.warn(`Modules directory not found: ${modulesDir}`);
      return;
    }

    const modulesList = fs.readdirSync(modulesDir, { withFileTypes: true });
    const moduleDirectories = modulesList.filter((item) => item.isDirectory());

    moduleDirectories.forEach((moduleDir) => {
      const modulePath = path.join(modulesDir, moduleDir.name);
      const routerPath = path.join(modulePath, routerExtension);

      if (!fs.existsSync(routerPath)) {
        console.warn(
          `Router file not found for module '${moduleDir.name}': ${routerExtension}`
        );
        return;
      }

      try {
        const routerModule = require(routerPath);
        const router = routerModule.default || routerModule;

        if (!router) {
          console.warn(`No default export found in router file: ${routerPath}`);
          return;
        }

        const routePath = `/api/${moduleDir.name}`;
        app.use(routePath, router);
        console.log(`Loaded router: ${routePath}`);
      } catch (err) {
        console.error(`Failed to load router at ${routerPath}`, err);
      }
    });
  } catch (error) {
    console.error("Failed to load routers:", error);
  }
};
