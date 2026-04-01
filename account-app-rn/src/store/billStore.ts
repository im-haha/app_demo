import {useAppStore} from './appStore';

export const useRecentBills = () => useAppStore(state => state.getBills().slice(0, 8));
