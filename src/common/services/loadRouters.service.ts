import { Application, Router } from "express";
import path from "path";
import { glob } from "glob";

export const loadRouters = async (app: Application) => {
  const routerFiles = await glob("src/modules/**/router.{ts,js}");

  routerFiles
    .map((file) => {
      const routerPath = path.resolve(file);
      const moduleName = file.split(path.sep)[
        file.split(path.sep).indexOf("modules") + 1
      ];
      return { routerPath, moduleName };
    })
    .forEach(async ({ routerPath, moduleName }) => {
      try {
        const mod = await import(routerPath);
        const router: Router = mod.default;

        if (router) {
          app.use(`/api/${moduleName}`, router);
          console.log(`🔗 Mounted /api/${moduleName}`);
        }
      } catch (err) {
        console.error(`❌ Failed to load router at ${routerPath}`, err);
      }
    });
};
