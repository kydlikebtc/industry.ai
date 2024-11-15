#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'dotenv/config';
import 'source-map-support/register';
import { EthGlobalBangkok2024Stack } from '../lib/eth-global-bangkok-2024-stack';

const app = new cdk.App();
new EthGlobalBangkok2024Stack(app, 'EthGlobalBangkok2024Stack', {
  env: {
    region: 'us-east-1',
  }
});
