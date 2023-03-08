import type { PauseOptions, WhitelistOptions } from "./common-options";
import type { ContractBuilder, BaseFunction } from "./contract";
import { Access, requireAccessControl } from "./set-access-control";
import { defineFunctions } from "./utils/define-functions";

export function addPausable(
  c: ContractBuilder,
  access: Access,
  pausableFns: BaseFunction[],
  pauseOpts: PauseOptions = {
    paused: false,
    unpausable: true,
  },
  bypassPause = false
) {
  c.addParent({
    name: "Pausable",
    path: "@openzeppelin/contracts/security/Pausable.sol",
  });

  for (const fn of pausableFns) {
    // c.addModifier("whenNotPaused", fn);
    if (access) {
      c.addFunctionCode("address sender = _msgSender();", fn);
    }

    c.addFunctionCode(
      `require(${access ? (access === "ownable" ? "owner() == sender ||" : "hasRole(DEFAULT_ADMIN_ROLE, sender) ||") : ""}${
        bypassPause ? " whitelist[sender] ||" : ""
      } !paused(),"Contract Paused, only the owner or a whitelisted user can do that");`,
      fn
    );
  }

  requireAccessControl(c, functions.pause, access, "PAUSER");
  c.addFunctionCode("_pause();", functions.pause);
  if (pauseOpts.unpausable) {
    requireAccessControl(c, functions.unpause, access, "PAUSER");
    c.addFunctionCode("_unpause();", functions.unpause);
  }
  if (pauseOpts.paused) {
    c.addConstructorCode(`_pause();`);
  }
}

const functions = defineFunctions({
  pause: {
    kind: "public" as const,
    args: [],
  },

  unpause: {
    kind: "public" as const,
    args: [],
  },
});
