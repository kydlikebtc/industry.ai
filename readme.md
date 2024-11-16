# Industry.ai

![](./frontend/public/industry.png)

### What is Industry.ai?

Industry.ai is a multi agent orchestration platform that enables productive recursive inference.

### What problem does it solve?

Industry.ai solves two problems:

1. **Agents manage their own wallets**: It streamlines and abstracts away the need for a user to have a wallet and manage private keys. Rather, agents hold their own keys and manage their own funds. While you, the user, can just talk with the agents in any natural language.
2. **Multi Agent Orchestration**: It allows users to orchestrate multiple agents to perform complex long running tasks while taking advantage of robust tools that abstract away needing to code.

Thinking more broadly, indsutry.ai solves a larger issue in the web3 industry which is related to code duplication. Currently there is a massive amount of code duplication across projects. Even with standard APIs for common products and services, there is still a large amount of code that needs to be written to connect them together. Industry.ai solves this problem by allowing users to orchestrate agents to perform complex tasks without the need to write code, completely transforming an API into natural language.

### How does it work?

We have built a multi-agent orchestration environment that handles intent routing between 4 specialized agents who work together seamlessly:

1. **Eric**: A laid-back market analyst who provides risk assessments and trading recommendations for crypto assets. He analyzes market trends and advises the team on trading decisions.

2. **Harper**: A high-strung trading expert who executes trades based on Eric's recommendations. She manages token and ETH balances, ensuring efficient trade execution.

3. **Rishi**: A laid-back smart contract and Web3 expert who handles all technical infrastructure. He creates wallets, deploys contracts, sets up Uniswap pools, and manages the technical foundation.

4. **Yasmin**: A creative marketing expert who crafts compelling content to promote the team's activities. She creates tweets and images while building community engagement.

The agents collaborate naturally - Eric analyzes opportunities and informs Harper, who executes trades using infrastructure Rishi has built, while Yasmin promotes their successes. This creates a complete cycle of analysis, execution, infrastructure, and promotion.

A user sends a message in the chat and the message is interpreted as an intent to perform a task. The message is then routed to the appropriate agent based on the task. The agent then performs the task and returns the result to the user (standard chat) Or routes the output to another agent (recursive inference).

Agents seamlessly use tools to perform their tasks. For example, Rishi uses the `create_wallet` tool to create a new wallet. If the wallet is created successfully, Rishi will return the address to the user. Otherwise, he will return an error.

The tools are essentially just API endpoints that are exposed to the agents. The tools are defined by the users and can be anything from simple CRUD operations to complex tasks that require multiple steps to complete.
