"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletConnect = exports.URI_AVAILABLE = void 0;
const types_1 = require("@web3-react/types");
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const utils_1 = require("./utils");
exports.URI_AVAILABLE = 'URI_AVAILABLE';
const DEFAULT_TIMEOUT = 5000;
class WalletConnect extends types_1.Connector {
    constructor({ actions, options, defaultChainId, timeout = DEFAULT_TIMEOUT, onError }) {
        super(actions, onError);
        this.events = new eventemitter3_1.default();
        this.disconnectListener = (error) => {
            var _a;
            this.actions.resetState();
            if (error)
                (_a = this.onError) === null || _a === void 0 ? void 0 : _a.call(this, error);
        };
        this.chainChangedListener = (chainId) => {
            this.actions.update({ chainId: Number.parseInt(chainId, 16) });
        };
        this.accountsChangedListener = (accounts) => {
            this.actions.update({ accounts });
        };
        this.URIListener = (uri) => {
            this.events.emit(exports.URI_AVAILABLE, uri);
        };
        const { rpcMap, rpc, chains } = options, rest = __rest(options, ["rpcMap", "rpc", "chains"]);
        this.options = rest;
        this.chains = chains;
        this.defaultChainId = defaultChainId;
        this.rpcMap = rpcMap || rpc;
        this.timeout = timeout;
    }
    isomorphicInitialize(desiredChainId = this.defaultChainId) {
        if (this.eagerConnection)
            return this.eagerConnection;
        const rpcMap = this.rpcMap ? (0, utils_1.getBestUrlMap)(this.rpcMap, this.timeout) : undefined;
        const chains = desiredChainId ? (0, utils_1.getChainsWithDefault)(this.chains, desiredChainId) : this.chains;
        return (this.eagerConnection = Promise.resolve().then(() => __importStar(require('@walletconnect/ethereum-provider'))).then((ethProviderModule) => __awaiter(this, void 0, void 0, function* () {
            const provider = (this.provider = yield ethProviderModule.default.init(Object.assign(Object.assign({}, this.options), { chains, rpcMap: yield rpcMap })));
            /**
             * TODO(INFRA-137):
             * WalletConnect `on` and `removeListener` methods do not return the provider instance,
             * but underlying EventEmitter instead. This is why we have to return `provider` explicitly later
             * rather than here.
             */
            provider
                .on('disconnect', this.disconnectListener)
                .on('chainChanged', this.chainChangedListener)
                .on('accountsChanged', this.accountsChangedListener)
                .on('display_uri', this.URIListener);
            return provider;
        })));
    }
    /** {@inheritdoc Connector.connectEagerly} */
    connectEagerly() {
        return __awaiter(this, void 0, void 0, function* () {
            const cancelActivation = this.actions.startActivation();
            try {
                const provider = yield this.isomorphicInitialize();
                // WalletConnect automatically persists and restores active sessions
                if (!provider.session) {
                    throw new Error('No active session found. Connect your wallet first.');
                }
                this.actions.update({ accounts: provider.accounts, chainId: provider.chainId });
            }
            catch (error) {
                yield this.deactivate();
                cancelActivation();
                throw error;
            }
        });
    }
    /**
     * @param desiredChainId - The desired chainId to connect to.
     */
    activate(desiredChainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = yield this.isomorphicInitialize(desiredChainId);
            if (provider.session) {
                if (!desiredChainId || desiredChainId === provider.chainId)
                    return;
                if (!this.chains.includes(desiredChainId)) {
                    throw new Error(`Cannot activate chain (${desiredChainId}) that was not included in initial options.chains.`);
                }
                return provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: `0x${desiredChainId.toString(16)}` }],
                });
            }
            const cancelActivation = this.actions.startActivation();
            try {
                yield provider.enable();
                this.actions.update({ chainId: provider.chainId, accounts: provider.accounts });
            }
            catch (error) {
                yield this.deactivate();
                cancelActivation();
                throw error;
            }
        });
    }
    /** {@inheritdoc Connector.deactivate} */
    deactivate() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            yield ((_a = this.provider) === null || _a === void 0 ? void 0 : _a.removeListener('disconnect', this.disconnectListener).removeListener('chainChanged', this.chainChangedListener).removeListener('accountsChanged', this.accountsChangedListener).removeListener('display_uri', this.URIListener));
            /**
             * TODO(INFRA-137): chain `disconnect()` too once WalletConnect fixes `removeListener` to return Provider instead of EventEmitter
             */
            (_b = this.provider) === null || _b === void 0 ? void 0 : _b.disconnect();
            this.provider = undefined;
            this.eagerConnection = undefined;
            this.actions.resetState();
        });
    }
}
exports.WalletConnect = WalletConnect;
