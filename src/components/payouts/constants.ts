import { TransferOption } from './types';

export const TRANSFER_OPTIONS: TransferOption[] = [
    { id: 1, name: 'Same Currency Transfer' as const, },
    { id: 2, name: 'Cray Balance Transfer' as const, },
    // { id: 3, name: 'Cross Currency Transfer' as const, },
];
