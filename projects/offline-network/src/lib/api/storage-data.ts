export interface StorageData<T> {
	key?: string;
	createdAt: number;
	updatedAt: number;
	value: T;
}
