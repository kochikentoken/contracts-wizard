import type { WhitelistOptions } from "./common-options";
import type { ContractBuilder } from "./contract";
import { Access, requireAccessControl } from "./set-access-control";
import { defineFunctions } from "./utils/define-functions";

export function addWhitelist(c: ContractBuilder, access: Access, whitelistOpts: WhitelistOptions, taxable: boolean) {
  requireAccessControl(c, functions.setWhitelisted, access, "WHITELISTER");
  c.setFunctionBody(["whitelist[addr] = is_whitelisted;"], functions.setWhitelisted);

  requireAccessControl(c, functions.setArrayWhitelisted, access, "WHITELISTER");
  c.setFunctionBody(["for (uint256 i = 0; i < addrs.length; i++) {\nwhitelist[addrs[i]] = is_whitelisted;\n}"], functions.setArrayWhitelisted);

  c.addVariable("mapping(address => bool) public whitelist;");
  c.addConstructorArgument({ name: "whiltelist_addrs", type: "address[] memory" });
  c.addConstructorCode("setArrayWhitelisted(whiltelist_addrs, true);");
  if (taxable) c.addConstructorCode("whitelist[_taxAddress] = true;");
  c.addConstructorCode("whitelist[user] = true;");
  c.addConstructorCode("whitelist[address(this)] = true;");
}

const functions = defineFunctions({
  setWhitelisted: {
    kind: "public" as const,
    args: [
      { name: "addr", type: "address" },
      { name: "is_whitelisted", type: "bool" },
    ],
  },
  setArrayWhitelisted: {
    kind: "public" as const,
    args: [
      { name: "addrs", type: "address[] memory" },
      { name: "is_whitelisted", type: "bool" },
    ],
  },
});
