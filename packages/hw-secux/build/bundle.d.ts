import type { SubstrateApp } from '@zondax/ledger-substrate';
import type { TransportType } from '@polkadot/hw-ledger-transports/types';
import type { AccountOptions, LedgerAddress, LedgerSignature, LedgerVersion } from './types.js';
import { ledgerApps } from './defaults.js';
export { packageInfo } from './packageInfo.js';
type Chain = keyof typeof ledgerApps;
/**
 * @name Ledger
 *
 * @description
 * A very basic wrapper for a ledger app -
 *   - it connects automatically on use, creating an underlying interface as required
 *   - Promises reject with errors (unwrapped errors from @zondax/ledger-substrate)
 */
export declare class Ledger {
    #private;
    constructor(transport: TransportType, chain: Chain);
    /**
     * Returns the address associated with a specific account & address offset. Optionally
     * asks for on-device confirmation
     */
    getAddress(confirm?: boolean, accountOffset?: number, addressOffset?: number, { account, addressIndex, change }?: Partial<AccountOptions>): Promise<LedgerAddress>;
    /**
     * Returns the version of the Ledger application on the device
     */
    getVersion(): Promise<LedgerVersion>;
    /**
     * Signs a transaction on the Ledger device
     */
    sign(message: Uint8Array, accountOffset?: number, addressOffset?: number, { account, addressIndex, change }?: Partial<AccountOptions>): Promise<LedgerSignature>;
    /**
     * @internal
     *
     * Returns a created SubstrateApp to perform operations against. Generally
     * this is only used internally, to ensure consistent bahavior.
     */
    withApp<T>(fn: (app: SubstrateApp) => Promise<T>): Promise<T>;
}
