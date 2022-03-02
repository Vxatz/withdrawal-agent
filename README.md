# Flexa Collateral Manager Large Transfers by Partition

## Description

This agent detects large transfers from Flexa Collateral Manager contract partitions.

## Supported Chains

- Ethereum

## Alerts

- FLEXA-2 
    * Fired when it detects `TransferByPartition` events emitted from the `Flexa Collater Manager` contract with a large amount.
    * Severity is always set to "Info".
    * Type is always set to "Info".
    * Metadata contains: 
        * `fromPartition`: Address of the partition from which the amount was transferred.
        * `fromAddress`: Address of the user who executed the transfer.
        * `toAddress`: Address of the user who received the transferred amount.
        * `amount`: Amount that was transferred. 
