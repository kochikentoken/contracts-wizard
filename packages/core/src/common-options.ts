import type { Access } from "./set-access-control";
import type { Info } from "./set-info";
import { defaults as infoDefaults } from "./set-info";
import type { Upgradeable } from "./set-upgradeable";

export const defaults: Required<CommonOptions> = {
  access: false,
  user: false,
  upgradeable: false,
  info: infoDefaults,
} as const;

export interface CommonOptions {
  access?: Access;
  user?: boolean;
  upgradeable?: Upgradeable;
  info?: Info;
}
export interface PauseOptions {
  paused?: boolean;
  unpausable?: boolean;
}
export function withCommonDefaults(opts: CommonOptions): Required<CommonOptions> {
  return {
    access: opts.access ?? false,
    user: opts.user ?? false,
    upgradeable: opts.upgradeable ?? false,
    info: opts.info ?? {},
  };
}
