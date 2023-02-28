/**
 * @param rpcMap - Map of chainIds to rpc url(s).
 * @param timeout - Timeout, in milliseconds, after which to consider network calls failed.
 */
export declare function getBestUrlMap(rpcMap: Record<string, string | string[]>, timeout: number): Promise<{
    [chainId: string]: string;
}>;
/**
 * @param chains - An array of chain IDs.
 * @param defaultChainId - The chain ID to treat as the default (it will be the first element in the returned array).
 */
export declare function getChainsWithDefault(chains: number[], defaultChainId: number): number[];
