import type { TaxOptions } from "./common-options";
import type { ContractBuilder } from "./contract";
import type { Access } from "./set-access-control";
import { defineFunctions } from "./utils/define-functions";

export function addTaxable(c: ContractBuilder, access: Access, taxOpts: TaxOptions) {
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
  c.setFunctionBody(["uint256 remainder = amount;", "remainder = payTaxes(amount, from);", "super._transfer(from, to, remainder);"], functions._transfer);

  c.addModifier("nonReentrant", functions.payTaxes);
  c.setFunctionBody(
    ["uint256 total_taxed_amount = (amount * taxPercentage) / 100;", "super._transfer(from, taxAddress, total_taxed_amount);", "return amount - total_taxed_amount;"],
    functions.payTaxes
  );

  if (access === "ownable") {
    if (taxOpts.taxAddressUpdatable) {
      c.addModifier("onlyOwner", functions.setTaxAddress);
      c.setFunctionBody(["taxAddress = _taxAddress;"], functions.setTaxAddress);
    }

    if (taxOpts.taxIncreasable) {
      c.addModifier("onlyOwner", functions.increaseTaxPercentage);
      c.setFunctionBody(['require(taxPercentage < _taxPercentage, "The new tax Percentage must be higher than the old one" );', "taxPercentage = _taxPercentage;"], functions.increaseTaxPercentage);
    }
    if (taxOpts.taxDecreasable) {
      c.addModifier("onlyOwner", functions.decreaseTaxPercentage);
      c.setFunctionBody(['require(taxPercentage > _taxPercentage, "The new tax Percentage must be lower than the old one" );', "taxPercentage = _taxPercentage;"], functions.decreaseTaxPercentage);
    }
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
  increaseTaxPercentage: {
    kind: "public" as const,
    args: [{ name: "_taxPercentage", type: "uint" }],
  },
  decreaseTaxPercentage: {
    kind: "public" as const,
    args: [{ name: "_taxPercentage", type: "uint" }],
  },
});

// TODO: WhiteLists mecha
