import * as path from "path";
import { Eta } from "eta";
import { NetworkType } from "../../types";

export class DaoContractGenerator {
  private eta: Eta;
  private network: NetworkType;
  private senderAddress: string;
  private daoName: string;
  private nameGenerator: ReturnType<typeof createDaoNameGenerator>;

  constructor(network: NetworkType, senderAddress: string, daoName: string) {
    this.eta = new Eta({ views: path.join(__dirname, "../templates/dao") });
    this.network = network;
    this.senderAddress = senderAddress;
    this.daoName = daoName;
    this.nameGenerator = createDaoNameGenerator(daoName);
  }

  // Helper methods
  private getContractAddress(contractType: DaoContractType): string {
    return `${this.senderAddress}.${this.nameGenerator.generate(contractType)}`;
  }

  private async renderTemplate(
    templatePath: string,
    data: ContractData
  ): Promise<string> {
    return this.eta.render(templatePath, {
      ...data,
      getTraitReference: (trait: string) =>
        getTraitReference(this.network, trait),
      getAddressReference: (address: string) =>
        getAddressReference(this.network, address),
    });
  }

  // Base Contract Generators
  private async generateBaseContract(): Promise<DaoContractInfo> {
    const source = await this.renderTemplate("base/dao-base.clar", {
      base_dao_trait: getTraitReference(this.network, "DAO_BASE"),
      proposal_trait: getTraitReference(this.network, "DAO_PROPOSAL"),
      extension_trait: getTraitReference(this.network, "DAO_EXTENSION"),
    });

    return {
      source,
      name: this.nameGenerator.generate(DaoContracts.BASE.DAO),
      address: this.getContractAddress(DaoContracts.BASE.DAO),
      category: "BASE",
      type: DaoContracts.BASE.DAO,
    };
  }
}
