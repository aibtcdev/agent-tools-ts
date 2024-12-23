import { program } from "commander";
import { DaoSDK } from "./lib/sdk";
import * as dotenv from "dotenv";
import chalk from "chalk";
import ora from "ora";

dotenv.config();

const sdk = new DaoSDK({
  network: (process.env.NETWORK as any) || "testnet",
  stacksApi: process.env.STACKS_API || "https://api.testnet.hiro.so",
});

program
  .name("dao")
  .description("CLI tool for managing DAOs on the Stacks blockchain")
  .version("1.0.0");

// Global options
program
  .option(
    "-n, --network <network>",
    "network to use (mainnet/testnet)",
    "testnet"
  )
  .option("-k, --key <key>", "sender private key")
  .option("-f, --fee <fee>", "transaction fee", "100000");

// Executor Commands
program
  .command("executor")
  .description("Manage DAO executors")
  .addCommand(
    program
      .command("list")
      .description("List all executor contracts")
      .action(async () => {
        const spinner = ora("Finding executor contracts...").start();
        try {
          const executors = await sdk.executor.findAll();
          spinner.succeed("Found executor contracts:");
          executors.forEach((executor) => {
            console.log(chalk.green(`- ${executor}`));
          });
        } catch (error) {
          spinner.fail("Failed to find executor contracts");
          console.error(chalk.red(error));
        }
      })
  )
  .addCommand(
    program
      .command("deploy")
      .description("Deploy a new executor contract")
      .requiredOption("-n, --name <name>", "name of the DAO")
      .option("-c, --contract <contract>", "contract name")
      .option(
        "-e, --extensions <extensions...>",
        "extension contracts to include"
      )
      .option("-d, --deployer", "include deployer", false)
      .action(async (options) => {
        const spinner = ora("Deploying executor contract...").start();
        try {
          const deployed = await sdk.executor.deploy({
            name: options.name,
            extensions: options.extensions || [],
            includeDeployer: options.deployer,
            senderKey: program.opts().key,
            fee: parseInt(program.opts().fee),
          });
          spinner.succeed("Deployed executor contract:");
          console.log(chalk.green(JSON.stringify(deployed, null, 2)));
        } catch (error) {
          spinner.fail("Failed to deploy executor contract");
          console.error(chalk.red(error));
        }
      })
  );

// Treasury Commands
program
  .command("treasury")
  .description("Manage DAO treasury")
  .addCommand(
    program
      .command("list")
      .description("List all treasury contracts")
      .action(async () => {
        const spinner = ora("Finding treasury contracts...").start();
        try {
          const treasuries = await sdk.treasury.findAll();
          spinner.succeed("Found treasury contracts:");
          treasuries.forEach((treasury) => {
            console.log(chalk.green(`- ${treasury}`));
          });
        } catch (error) {
          spinner.fail("Failed to find treasury contracts");
          console.error(chalk.red(error));
        }
      })
  )
  .addCommand(
    program
      .command("deposit-stx")
      .description("Deposit STX into treasury")
      .requiredOption("-t, --treasury <treasury>", "treasury contract ID")
      .requiredOption("-a, --amount <amount>", "amount in microSTX")
      .action(async (options) => {
        const spinner = ora("Depositing STX...").start();
        try {
          const result = await sdk.treasury.depositStx(
            options.treasury,
            parseInt(options.amount),
            {
              senderKey: program.opts().key,
              fee: parseInt(program.opts().fee),
            }
          );
          spinner.succeed("Deposited STX:");
          console.log(chalk.green(JSON.stringify(result, null, 2)));
        } catch (error) {
          spinner.fail("Failed to deposit STX");
          console.error(chalk.red(error));
        }
      })
  );

// Bank Account Commands
program
  .command("bank")
  .description("Manage DAO bank accounts")
  .addCommand(
    program
      .command("list")
      .description("List all bank account contracts")
      .action(async () => {
        const spinner = ora("Finding bank account contracts...").start();
        try {
          const accounts = await sdk.bankAccount.findAll();
          spinner.succeed("Found bank account contracts:");
          accounts.forEach((account) => {
            console.log(chalk.green(`- ${account}`));
          });
        } catch (error) {
          spinner.fail("Failed to find bank account contracts");
          console.error(chalk.red(error));
        }
      })
  )
  .addCommand(
    program
      .command("balance")
      .description("Get bank account balance")
      .requiredOption("-a, --account <account>", "bank account contract ID")
      .action(async (options) => {
        const spinner = ora("Getting balance...").start();
        try {
          const balance = await sdk.bankAccount.getBalance(options.account);
          spinner.succeed("Account balance:");
          console.log(chalk.green(`${balance} microSTX`));
        } catch (error) {
          spinner.fail("Failed to get balance");
          console.error(chalk.red(error));
        }
      })
  );

// Messaging Commands
program
  .command("messaging")
  .description("Manage DAO messaging")
  .addCommand(
    program
      .command("send")
      .description("Send a message")
      .requiredOption("-c, --contract <contract>", "messaging contract ID")
      .requiredOption("-m, --message <message>", "message to send")
      .action(async (options) => {
        const spinner = ora("Sending message...").start();
        try {
          const result = await sdk.messaging.send(
            options.contract,
            options.message,
            undefined,
            {
              senderKey: program.opts().key,
              fee: parseInt(program.opts().fee),
            }
          );
          spinner.succeed("Message sent:");
          console.log(chalk.green(JSON.stringify(result, null, 2)));
        } catch (error) {
          spinner.fail("Failed to send message");
          console.error(chalk.red(error));
        }
      })
  );

// Payments Commands
program
  .command("payments")
  .description("Manage DAO payments")
  .addCommand(
    program
      .command("list")
      .description("List all payment contracts")
      .action(async () => {
        const spinner = ora("Finding payment contracts...").start();
        try {
          const payments = await sdk.payments.findAll();
          spinner.succeed("Found payment contracts:");
          payments.forEach((payment) => {
            console.log(chalk.green(`- ${payment}`));
          });
        } catch (error) {
          spinner.fail("Failed to find payment contracts");
          console.error(chalk.red(error));
        }
      })
  )
  .addCommand(
    program
      .command("add-resource")
      .description("Add a new resource")
      .requiredOption("-c, --contract <contract>", "payments contract ID")
      .requiredOption("-n, --name <name>", "resource name")
      .requiredOption("-d, --description <description>", "resource description")
      .requiredOption("-p, --price <price>", "resource price in microSTX")
      .action(async (options) => {
        const spinner = ora("Adding resource...").start();
        try {
          const result = await sdk.payments.addResource(
            options.contract,
            options.name,
            options.description,
            parseInt(options.price),
            {
              senderKey: program.opts().key,
              fee: parseInt(program.opts().fee),
            }
          );
          spinner.succeed("Resource added:");
          console.log(chalk.green(JSON.stringify(result, null, 2)));
        } catch (error) {
          spinner.fail("Failed to add resource");
          console.error(chalk.red(error));
        }
      })
  );

program.parse();
