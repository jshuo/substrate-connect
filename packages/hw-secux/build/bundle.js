import { newSubstrateApp } from '@zondax/ledger-substrate';
import { transports } from '@polkadot/hw-ledger-transports';
import { hexAddPrefix, u8aToBuffer } from '@polkadot/util';
import { LEDGER_DEFAULT_ACCOUNT, LEDGER_DEFAULT_CHANGE, LEDGER_DEFAULT_INDEX, LEDGER_SUCCESS_CODE } from './constants.js';
import { ledgerApps } from './defaults.js';
export { packageInfo } from './packageInfo.js';
/** @internal Wraps a SubstrateApp call, checking the result for any errors which result in a rejection */
async function wrapError(promise) {
    const result = await promise;
    if (result.return_code !== LEDGER_SUCCESS_CODE) {
        throw new Error(result.error_message);
    }
    return result;
}
/**
 * @name Ledger
 *
 * @description
 * A very basic wrapper for a ledger app -
 *   - it connects automatically on use, creating an underlying interface as required
 *   - Promises reject with errors (unwrapped errors from @zondax/ledger-substrate)
 */
export class Ledger {
    constructor(transport, chain) {
        this.__internal__app = null;
        const ledgerName = ledgerApps[chain];
        const transportDef = transports.find(({ type }) => type === transport);
        if (!ledgerName) {
            throw new Error(`Unsupported Ledger chain ${chain}`);
        }
        else if (!transportDef) {
            throw new Error(`Unsupported Ledger transport ${transport}`);
        }
        this.__internal__ledgerName = ledgerName;
        this.__internal__transportDef = transportDef;
    }
    /**
     * Returns the address associated with a specific account & address offset. Optionally
     * asks for on-device confirmation
     */
    async getAddress(confirm = false, accountOffset = 0, addressOffset = 0, { account = LEDGER_DEFAULT_ACCOUNT, addressIndex = LEDGER_DEFAULT_INDEX, change = LEDGER_DEFAULT_CHANGE } = {}) {
        return this.withApp(async (app) => {
            const { address, pubKey } = await wrapError(app.getAddress(account + accountOffset, change, addressIndex + addressOffset, confirm));
            return {
                address,
                publicKey: hexAddPrefix(pubKey)
            };
        });
    }
    /**
     * Returns the version of the Ledger application on the device
     */
    async getVersion() {
        return this.withApp(async (app) => {
            const { device_locked: isLocked, major, minor, patch, test_mode: isTestMode } = await wrapError(app.getVersion());
            return {
                isLocked,
                isTestMode,
                version: [major, minor, patch]
            };
        });
    }
    /**
     * Signs a transaction on the Ledger device
     */
    async sign(message, accountOffset = 0, addressOffset = 0, { account = LEDGER_DEFAULT_ACCOUNT, addressIndex = LEDGER_DEFAULT_INDEX, change = LEDGER_DEFAULT_CHANGE } = {}) {
        return this.withApp(async (app) => {
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
    async withApp(fn) {
        try {
            if (!this.__internal__app) {
                const transport = await this.__internal__transportDef.create();
                this.__internal__app = newSubstrateApp(transport, this.__internal__ledgerName);
            }
            return await fn(this.__internal__app);
        }
        catch (error) {
            this.__internal__app = null;
            throw error;
        }
    }
}
