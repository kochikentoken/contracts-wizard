import type { ERC20Options } from "../erc20";
import { accessOptions } from "../set-access-control";
import { infoOptions } from "../set-info";
import { upgradeableOptions } from "../set-upgradeable";
import { generateAlternatives } from "./alternatives";

const booleans = [true, false];

const blueprint = {
  name: ["MyToken"],
  symbol: ["MTK"],
  burnable: booleans,
  snapshots: booleans,
  pausable: booleans,
  pauseOpts: [
    {
      paused: false,
      unpausable: true,
    },
  ],
  mintable: booleans,
  permit: booleans,
  votes: booleans,
  flashmint: booleans,
  premint: ["1"],
  access: accessOptions,
  user: booleans,
  upgradeable: upgradeableOptions,
  info: infoOptions,
  taxOpts: [
    {
      taxable: false,
      taxAddressUpdatable: false,
      taxDecreasable: false,
      taxIncreasable: false,
    },
  ],
};

export function* generateERC20Options(): Generator<Required<ERC20Options>> {
  yield* generateAlternatives(blueprint);
}
