import { useApi } from './useApi';
import { complaintsAPI } from '@/core/api';
import type { 
  Complaint, 
  CreateComplaintData, 
  ReviewComplaintData, 
  UpdateComplaintData 
} from '@/types';

export var useComplaints = () => {
  var getComplaintsApi = useApi<{ complaints: Complaint[]; total: number }>();
  var getComplaintApi = useApi<Complaint>();
  var createComplaintApi = useApi<Complaint>();
  var updateComplaintApi = useApi<Complaint>();
  var deleteComplaintApi = useApi<any>();
  var reviewComplaintApi = useApi<Complaint>();

  var getComplaints = (params?: any) => 
    getComplaintsApi[3](complaintsAPI.getComplaints(params));

  var getComplaint = (id: string) => 
    getComplaintApi[3](complaintsAPI.getComplaintById(id));

  var createComplaint = (data: CreateComplaintData) => 
    createComplaintApi[3](complaintsAPI.createComplaint(data));

  var updateComplaint = (id: string, data: UpdateComplaintData) => 
    updateComplaintApi[3](complaintsAPI.updateComplaint(id, data));

  var deleteComplaint = (id: string) => 
    deleteComplaintApi[3](complaintsAPI.deleteComplaint(id));

  var reviewComplaint = (id: string, data: ReviewComplaintData) => 
    reviewComplaintApi[3](complaintsAPI.reviewComplaint(id, data));

  return {
    getComplaints: {
      0: getComplaintsApi[0],
      1: getComplaintsApi[1],
      2: getComplaintsApi[2],
      3: getComplaints,
      4: getComplaintsApi[4]
    },
    getComplaint: {
      0: getComplaintApi[0],
      1: getComplaintApi[1],
      2: getComplaintApi[2],
      3: getComplaint,
      4: getComplaintApi[4]
    },
    createComplaint: {
      0: createComplaintApi[0],
      1: createComplaintApi[1],
      2: createComplaintApi[2],
      3: createComplaint,
      4: createComplaintApi[4]
    },
    updateComplaint: {
      0: updateComplaintApi[0],
      1: updateComplaintApi[1],
      2: updateComplaintApi[2],
      3: updateComplaint,
      4: updateComplaintApi[4]
    },
    deleteComplaint: {
      0: deleteComplaintApi[0],
      1: deleteComplaintApi[1],
      2: deleteComplaintApi[2],
      3: deleteComplaint,
      4: deleteComplaintApi[4]
    },
    reviewComplaint: {
      0: reviewComplaintApi[0],
      1: reviewComplaintApi[1],
      2: reviewComplaintApi[2],
      3: reviewComplaint,
      4: reviewComplaintApi[4]
    }
  };
};