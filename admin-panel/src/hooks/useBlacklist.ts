import { useApi } from './useApi';
import { blacklistAPI } from '@/core/api';
import type { 
  BlacklistEntry, 
  CreateBlacklistEntryData, 
  ApproveBlacklistEntryData, 
  RevokeBlacklistEntryData, 
  UpdateBlacklistEntryData 
} from '@/types';

export var useBlacklist = () => {
  var getEntriesApi = useApi<{ entries: BlacklistEntry[]; total: number }>();
  var getEntryApi = useApi<BlacklistEntry>();
  var createEntryApi = useApi<BlacklistEntry>();
  var updateEntryApi = useApi<BlacklistEntry>();
  var deleteEntryApi = useApi<any>();
  var approveEntryApi = useApi<BlacklistEntry>();
  var revokeEntryApi = useApi<BlacklistEntry>();
  var checkUserApi = useApi<{ isBlacklisted: boolean }>();

  var getEntries = (params?: any) => 
    getEntriesApi[3](blacklistAPI.getBlacklistEntries(params));

  var getEntry = (id: string) => 
    getEntryApi[3](blacklistAPI.getBlacklistEntryById(id));

  var createEntry = (data: CreateBlacklistEntryData) => 
    createEntryApi[3](blacklistAPI.createBlacklistEntry(data));

  var updateEntry = (id: string, data: UpdateBlacklistEntryData) => 
    updateEntryApi[3](blacklistAPI.updateBlacklistEntry(id, data));

  var deleteEntry = (id: string) => 
    deleteEntryApi[3](blacklistAPI.deleteBlacklistEntry(id));

  var approveEntry = (id: string, data: ApproveBlacklistEntryData) => 
    approveEntryApi[3](blacklistAPI.approveBlacklistEntry(id, data));

  var revokeEntry = (id: string, data: RevokeBlacklistEntryData) => 
    revokeEntryApi[3](blacklistAPI.revokeBlacklistEntry(id, data));

  var checkUser = (userId: string) => 
    checkUserApi[3](blacklistAPI.checkUserBlacklist(userId));

  return {
    getEntries: {
      0: getEntriesApi[0],
      1: getEntriesApi[1],
      2: getEntriesApi[2],
      3: getEntries,
      4: getEntriesApi[4]
    },
    getEntry: {
      0: getEntryApi[0],
      1: getEntryApi[1],
      2: getEntryApi[2],
      3: getEntry,
      4: getEntryApi[4]
    },
    createEntry: {
      0: createEntryApi[0],
      1: createEntryApi[1],
      2: createEntryApi[2],
      3: createEntry,
      4: createEntryApi[4]
    },
    updateEntry: {
      0: updateEntryApi[0],
      1: updateEntryApi[1],
      2: updateEntryApi[2],
      3: updateEntry,
      4: updateEntryApi[4]
    },
    deleteEntry: {
      0: deleteEntryApi[0],
      1: deleteEntryApi[1],
      2: deleteEntryApi[2],
      3: deleteEntry,
      4: deleteEntryApi[4]
    },
    approveEntry: {
      0: approveEntryApi[0],
      1: approveEntryApi[1],
      2: approveEntryApi[2],
      3: approveEntry,
      4: approveEntryApi[4]
    },
    revokeEntry: {
      0: revokeEntryApi[0],
      1: revokeEntryApi[1],
      2: revokeEntryApi[2],
      3: revokeEntry,
      4: revokeEntryApi[4]
    },
    checkUser: {
      0: checkUserApi[0],
      1: checkUserApi[1],
      2: checkUserApi[2],
      3: checkUser,
      4: checkUserApi[4]
    }
  };
};