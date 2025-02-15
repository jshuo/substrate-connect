// Copyright 2017-2023 @polkadot/hw-secux authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { HexString } from '@polkadot/util/types';

export interface AccountOptions {
  /** The index of the account */
  account: number;
  /** The index of the address */
  addressIndex: number;
  /** The change to apply */
  change: number;
}

export interface SecuXAddress {
  /** The ss58 encoded address */
  address: string;
  /** The hex-encoded publicKey */
  publicKey: HexString;
}

export interface SecuXSignature {
  /** A hex-encoded signature, as generated by the device */
  signature: HexString;
}

export interface SecuXVersion {
  transportVersion: number;
  seFwVersion: string;
  mcuFwVersion: string;
  bootloaderVersion: string;
}

