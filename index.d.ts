import type WalletConnectProvider from '@walletconnect/ethereum-provider';
import type { Actions } from '@web3-react/types';
import { Connector } from '@web3-react/types';
import EventEmitter3 from 'eventemitter3';
export declare const URI_AVAILABLE = "URI_AVAILABLE";
/**
 * Options to configure the WalletConnect provider.
 * For the full list of options, see {@link https://docs.walletconnect.com/2.0/javascript/providers/ethereum#initialization WalletConnect documentation}.
 */
export type WalletConnectOptions = Omit<Parameters<typeof WalletConnectProvider.init>[0], 'rpcMap'> & {
    /**
     * Map of chainIds to rpc url(s). If multiple urls are provided, the first one that responds
     * within a given timeout will be used. Note that multiple urls are not supported by WalletConnect by default.
     * That's why we extend its options with our own `rpcMap` (@see getBestUrlMap).
     */
    rpcMap?: {
        [chainId: number]: string | string[];
    };
    /** @deprecated Use `rpcMap` instead. */
    rpc?: {
        [chainId: number]: string | string[];
    };
};
/**
 * Options to configure the WalletConnect connector.
 */
export interface WalletConnectConstructorArgs {
    actions: Actions;
    /** Options to pass to `@walletconnect/ethereum-provider`. */
    options: WalletConnectOptions;
    /** The chainId to connect to in activate if one is not provided. */
    defaultChainId?: number;
    /**
     * @param timeout - Timeout, in milliseconds, after which to treat network calls to urls as failed when selecting
     * online urls.
     */
    timeout?: number;
    /**
     * @param onError - Handler to report errors thrown from WalletConnect.
     */
    onError?: (error: Error) => void;
}
export declare class WalletConnect extends Connector {
    /** {@inheritdoc Connector.provider} */
    provider?: WalletConnectProvider;
    readonly events: EventEmitter3<string | symbol, any>;
    private readonly options;
    private readonly rpcMap?;
    private readonly chains;
    private readonly defaultChainId?;
    private readonly timeout;
    private eagerConnection?;
    constructor({ actions, options, defaultChainId, timeout, onError }: WalletConnectConstructorArgs);
    private disconnectListener;
    private chainChangedListener;
    private accountsChangedListener;
    private URIListener;
    private isomorphicInitialize;
    /** {@inheritdoc Connector.connectEagerly} */
    connectEagerly(): Promise<void>;
    /**
     * @param desiredChainId - The desired chainId to connect to.
     */
    activate(desiredChainId?: number): Promise<void>;
    /** {@inheritdoc Connector.deactivate} */
    deactivate(): Promise<void>;
}
