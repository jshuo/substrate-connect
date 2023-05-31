"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ledger = exports.packageInfo = void 0;
const ledger_substrate_1 = require("@zondax/ledger-substrate");
const hw_ledger_transports_1 = require("@polkadot/hw-ledger-transports");
const util_1 = require("@polkadot/util");
const constants_js_1 = require("./constants.js");
const defaults_js_1 = require("./defaults.js");
var packageInfo_js_1 = require("./packageInfo.js");
Object.defineProperty(exports, "packageInfo", { enumerable: true, get: function () { return packageInfo_js_1.packageInfo; } });
/** @internal Wraps a SubstrateApp call, checking the result for any errors which result in a rejection */
async function wrapError(promise) {
    const result = await promise;
    if (result.return_code !== constants_js_1.LEDGER_SUCCESS_CODE) {
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
class Ledger {
    constructor(transport, chain) {
        this.__internal__app = null;
        const ledgerName = defaults_js_1.ledgerApps[chain];
        const transportDef = hw_ledger_transports_1.transports.find(({ type }) => type === transport);
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
    async getAddress(confirm = false, accountOffset = 0, addressOffset = 0, { account = constants_js_1.LEDGER_DEFAULT_ACCOUNT, addressIndex = constants_js_1.LEDGER_DEFAULT_INDEX, change = constants_js_1.LEDGER_DEFAULT_CHANGE } = {}) {
        return this.withApp(async (app) => {
            const { address, pubKey } = await wrapError(app.getAddress(account + accountOffset, change, addressIndex + addressOffset, confirm));
            return {
                address,
                publicKey: (0, util_1.hexAddPrefix)(pubKey)
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
    async sign(message, accountOffset = 0, addressOffset = 0, { account = constants_js_1.LEDGER_DEFAULT_ACCOUNT, addressIndex = constants_js_1.LEDGER_DEFAULT_INDEX, change = constants_js_1.LEDGER_DEFAULT_CHANGE } = {}) {
        return this.withApp(async (app) => {
            const buffer = (0, util_1.u8aToBuffer)(message);
            const { signature } = await wrapError(app.sign(account + accountOffset, change, addressIndex + addressOffset, buffer));
            return {
                signature: (0, util_1.hexAddPrefix)(signature.toString('hex'))
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
                this.__internal__app = (0, ledger_substrate_1.newSubstrateApp)(transport, this.__internal__ledgerName);
            }
            return await fn(this.__internal__app);
        }
        catch (error) {
            this.__internal__app = null;
            throw error;
        }
    }
}
exports.Ledger = Ledger;
