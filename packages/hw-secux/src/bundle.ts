// Copyright 2017-2023 @polkadot/hw-secux authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SubstrateApp } from 'secux-substrate';
// @ts-ignore
import { SecuxWebUSB } from '@secux/transport-webusb'
import { SecuxDevice } from '@secux/protocol-device'
import type { AccountOptions, SecuXAddress, SecuXSignature, SecuXVersion } from './types.js';

import { newSubstrateApp } from 'secux-substrate';

import { hexAddPrefix, u8aToBuffer } from '@polkadot/util';

import { SECUX_DEFAULT_ACCOUNT, SECUX_DEFAULT_CHANGE, SECUX_DEFAULT_INDEX, SECUX_SUCCESS_CODE } from './constants.js';
import { SecuXApps } from './defaults.js';

export { packageInfo } from './packageInfo.js';

type Chain = keyof typeof SecuXApps;

type WrappedResult = Awaited<ReturnType<SubstrateApp['getAddress' | 'getVersion' | 'sign']>>;

/** @internal Wraps a SubstrateApp call, checking the result for any errors which result in a rejection */
async function wrapError <T extends WrappedResult> (promise: Promise<T>): Promise<T> {
  const result = await promise;

  if (result.return_code !== SECUX_SUCCESS_CODE) {
    throw new Error(result.error_message);
  }

  return result;
}

/**
 * @name SecuX
 *
 * @description
 * A very basic wrapper for a secux app -
 *   - it connects automatically on use, creating an underlying interface as required
 *   - Promises reject with errors (unwrapped errors from @zondax/secux-substrate)
 */
export class SecuX {
  readonly #secuxName: string;

  #app: SubstrateApp | null = null;

  constructor (chain: Chain) {
    const secuxName = SecuXApps[chain];


    this.#secuxName = secuxName;
  }

  /**
   * Returns the address associated with a specific account & address offset. Optionally
   * asks for on-device confirmation
   */
  public async getAddress (confirm = false, accountOffset = 0, addressOffset = 0, { account = SECUX_DEFAULT_ACCOUNT, addressIndex = SECUX_DEFAULT_INDEX, change = SECUX_DEFAULT_CHANGE }: Partial<AccountOptions> = {}): Promise<SecuXAddress> {
    return this.withApp(async (app: SubstrateApp): Promise<SecuXAddress> => {
      const { address, pubKey } = await wrapError(app.getAddress(account + accountOffset, change, addressIndex + addressOffset, confirm));

      return {
        address,
        publicKey: hexAddPrefix(pubKey)
      };
    });
  }

  /**
   * Returns the version of the SecuX application on the device
   */
  public async getVersion (transport: any): Promise<SecuXVersion> {
      const config = await SecuxDevice.getVersion(transport)
      return config

  }

  /**
   * Signs a transaction on the SecuX device
   */
  public async sign (message: Uint8Array, accountOffset = 0, addressOffset = 0, { account = SECUX_DEFAULT_ACCOUNT, addressIndex = SECUX_DEFAULT_INDEX, change = SECUX_DEFAULT_CHANGE }: Partial<AccountOptions> = {}): Promise<SecuXSignature> {
    return this.withApp(async (app: SubstrateApp): Promise<SecuXSignature> => {
      const buffer = u8aToBuffer(message);
      const { signature } = await wrapError(app.sign(account + accountOffset, change, addressIndex + addressOffset, buffer));

      return {
        signature: hexAddPrefix(signature.toString('hex'))
      };
    });
  }

  /**
   * @internal
   *
   * Returns a created SubstrateApp to perform operations against. Generally
   * this is only used internally, to ensure consistent bahavior.
   */
  async withApp <T> (fn: (app: SubstrateApp) => Promise<T>): Promise<T> {
    try {
      if (!this.#app) {
        const transport =  await SecuxWebUSB.Create(
          () => console.log('connected'),
          async () => {
              console.log('disconnected')
          }
      )

        this.#app = newSubstrateApp(transport, this.#secuxName);
      }

      return await fn(this.#app);
    } catch (error) {
      this.#app = null;

      throw error;
    }
  }
}
