import { program } from "commander";
import { Dexterity } from "dexterity-sdk";
import chalk from "chalk";
import ora from "ora";

// Initialize Dexterity
await Dexterity.deriveSigner();

// Global options
program
  .description("CLI tool for managing Dexterity liquidity vaults")
  .version("0.1.0");

// Create main command group
const vault = program.command("vault").description("Manage liquidity vaults");

// Vault subcommands
vault
  .command("create")
  .description("Create a new liquidity vault")
  .requiredOption("-c, --contract <contractId>", "contract ID for the pool")
  .requiredOption("-n, --name <name>", "name of the LP token")
  .requiredOption("-s, --symbol <symbol>", "symbol for the LP token")
  .requiredOption("-f, --fee <fee>", "pool fee percentage", parseFloat)
  .requiredOption("-ta, --tokenA <contractId>", "contract ID for token A")
  .requiredOption("-tb, --tokenB <contractId>", "contract ID for token B")
  .requiredOption(
    "-ra, --reservesA <amount>",
    "initial reserves for token A",
    parseFloat
  )
  .requiredOption(
    "-rb, --reservesB <amount>",
    "initial reserves for token B",
    parseFloat
  )
  .option("-d, --deploy", "deploy the contract instead of just generating code")
  .action(async (options) => {
    const spinner = ora("Preparing liquidity pool configuration...").start();

    try {
      const poolConfig = {
        contractId: options.contract,
        name: options.name,
        identifier: options.symbol,
        symbol: options.symbol,
        decimals: 6,
        fee: options.fee,
        liquidity: [
          {
            ...(await Dexterity.getTokenInfo(options.tokenA)),
            reserves: options.reservesA,
          },
          {
            ...(await Dexterity.getTokenInfo(options.tokenB)),
            reserves: options.reservesB,
          },
        ],
      };

      spinner.text = options.deploy
        ? "Deploying liquidity pool contract..."
        : "Generating contract code...";

      if (options.deploy) {
        const result = await Dexterity.codegen.deployContract(poolConfig);
        spinner.succeed("Deployed liquidity pool contract:");
        console.log(chalk.green(JSON.stringify(result, null, 2)));
      } else {
        const code = await Dexterity.codegen.generateContractCode(poolConfig);
        spinner.succeed("Generated contract code:");
        console.log(chalk.green(code));
      }
    } catch (error) {
      spinner.fail("Failed to create liquidity pool");
      console.error(chalk.red(error));
    }
  });

// Parse command line arguments
program.parse();
