import type { TaxOptions, WhitelistOptions } from "./common-options";
import type { ContractBuilder } from "./contract";
import { Access, requireAccessControl } from "./set-access-control";
import { defineFunctions } from "./utils/define-functions";

export function addTaxable(c: ContractBuilder, access: Access, taxOpts: TaxOptions, pausable: boolean, whitelistOpts: WhitelistOptions) {
  c.addParent({
    name: "ReentrancyGuard",
    path: "@openzeppelin/contracts/security/ReentrancyGuard.sol",
  });

  c.addVariable("address taxAddress;");
  c.addVariable("uint public taxPercentage;");
  c.addConstructorArgument({ name: "_taxAddress", type: "address" });
  c.addConstructorArgument({ name: "_taxPercentage", type: "uint" });
  c.addConstructorCode("taxAddress = _taxAddress;");
  c.addConstructorCode("taxPercentage = _taxPercentage;");

  c.addOverride("ERC20", functions._transfer);

  const transferBody: string[] = [];
  if (pausable) {
    transferBody.push(`if(owner() != _msgSender()${whitelistOpts.bypassPause ? " && !whitelist[from]" : ""})`);
    transferBody.push('require(!paused(), "ERROR: The token is currently paused for maintenance.");');
  }
  transferBody.push("uint256 remainder = amount;");
  if (whitelistOpts.bypassTax) transferBody.push("if(!whitelist[from])");
  transferBody.push("remainder = payTaxes(amount, from);");
  transferBody.push("super._transfer(from, to, remainder);");
  c.setFunctionBody(transferBody, functions._transfer);

  c.addModifier("nonReentrant", functions.payTaxes);
  c.setFunctionBody(
    ["uint256 total_taxed_amount = (amount * taxPercentage) / 100;", "super._transfer(from, taxAddress, total_taxed_amount);", "return amount - total_taxed_amount;"],
    functions.payTaxes
  );

  if (access) {
    if (taxOpts.taxAddressUpdatable) {
      c.setFunctionBody(["taxAddress = _taxAddress;"], functions.setTaxAddress);
    }

    if (taxOpts.taxIncreasable && taxOpts.taxDecreasable) {
      c.setFunctionBody(["taxPercentage = _taxPercentage;"], functions.setTaxPercentage);
    } else if (taxOpts.taxIncreasable) {
      c.setFunctionBody(['require(taxPercentage < _taxPercentage, "The new tax Percentage must be higher than the old one" );', "taxPercentage = _taxPercentage;"], functions.setTaxPercentage);
    } else if (taxOpts.taxDecreasable) {
      c.setFunctionBody(['require(taxPercentage > _taxPercentage, "The new tax Percentage must be lower than the old one" );', "taxPercentage = _taxPercentage;"], functions.setTaxPercentage);
    }

    // MODIFIER PART
    if (taxOpts.taxAddressUpdatable) requireAccessControl(c, functions.setTaxAddress, access, "TAXER");
    if (taxOpts.taxIncreasable || taxOpts.taxDecreasable) requireAccessControl(c, functions.setTaxPercentage, access, "TAXER");
  }
}

const functions = defineFunctions({
  _transfer: {
    kind: "internal" as const,
    args: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  payTaxes: {
    kind: "internal" as const,
    args: [
      { name: "amount", type: "uint256" },
      { name: "from", type: "address" },
    ],
    returns: ["uint256"],
  },
  setTaxAddress: {
    kind: "public" as const,
    args: [{ name: "_taxAddress", type: "address" }],
  },
  setTaxPercentage: {
    kind: "public" as const,
    args: [{ name: "_taxPercentage", type: "uint" }],
  },
});
