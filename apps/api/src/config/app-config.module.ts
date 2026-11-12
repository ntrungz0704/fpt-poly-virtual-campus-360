import path from "node:path";
import { DynamicModule, Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { findMonorepoRoot } from "./repo-root";
import { validateAndBuildEnv } from "./env.schema";

@Global()
@Module({})
export class AppConfigModule {
  static forRoot(rawOverrides?: Record<string, string>): DynamicModule {
    const useOverrides = Boolean(rawOverrides);
    return {
      module: AppConfigModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          ignoreEnvFile: useOverrides,
          envFilePath: useOverrides
            ? []
            : [
                path.resolve(process.cwd(), ".env"),
                path.resolve(findMonorepoRoot(), ".env"),
              ],
          validate: (config) =>
            validateAndBuildEnv({
              ...config,
              ...(rawOverrides ?? {}),
            }),
        }),
      ],
      exports: [ConfigModule],
    };
  }
}
