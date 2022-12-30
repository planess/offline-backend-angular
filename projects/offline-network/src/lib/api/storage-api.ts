export interface StorageApi {
	persist: <T extends string | number | object | null>(key: string, data: T) => Promise<boolean>;
	retrieve: <T extends string | object>(key: string) => Promise<T | null>;
}
