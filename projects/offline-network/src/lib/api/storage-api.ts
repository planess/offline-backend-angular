import { StorageData } from './storage-data';

export interface StorageApi {
	persist: <R>(key: string, data: R) => Promise<void>;
	retrieve: <T>(key: string) => Promise<StorageData<T> | null>;
	delete: (key: string) => Promise<void>;
}
