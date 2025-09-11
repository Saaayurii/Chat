import { useApi } from './useApi';
import { questionsAPI } from '@/core/api';
import type { 
  Question, 
  CreateQuestionData, 
  AssignOperatorData, 
  TransferQuestionData, 
  CloseQuestionData, 
  UpdateQuestionData 
} from '@/types';

export var useQuestions = () => {
  var getQuestionsApi = useApi<{ questions: Question[]; total: number }>();
  var getQuestionApi = useApi<Question>();
  var createQuestionApi = useApi<Question>();
  var updateQuestionApi = useApi<Question>();
  var deleteQuestionApi = useApi<any>();
  var assignOperatorApi = useApi<Question>();
  var transferQuestionApi = useApi<Question>();
  var closeQuestionApi = useApi<Question>();

  var getQuestions = (params?: any) => 
    getQuestionsApi[3](questionsAPI.getQuestions(params));

  var getQuestion = (id: string) => 
    getQuestionApi[3](questionsAPI.getQuestionById(id));

  var createQuestion = (data: CreateQuestionData) => 
    createQuestionApi[3](questionsAPI.createQuestion(data));

  var updateQuestion = (id: string, data: UpdateQuestionData) => 
    updateQuestionApi[3](questionsAPI.updateQuestion(id, data));

  var deleteQuestion = (id: string) => 
    deleteQuestionApi[3](questionsAPI.deleteQuestion(id));

  var assignOperator = (id: string, data: AssignOperatorData) => 
    assignOperatorApi[3](questionsAPI.assignOperator(id, data));

  var transferQuestion = (id: string, data: TransferQuestionData) => 
    transferQuestionApi[3](questionsAPI.transferQuestion(id, data));

  var closeQuestion = (id: string, data: CloseQuestionData) => 
    closeQuestionApi[3](questionsAPI.closeQuestion(id, data));

  return {
    getQuestions: {
      0: getQuestionsApi[0],
      1: getQuestionsApi[1],
      2: getQuestionsApi[2],
      3: getQuestions,
      4: getQuestionsApi[4]
    },
    getQuestion: {
      0: getQuestionApi[0],
      1: getQuestionApi[1],
      2: getQuestionApi[2],
      3: getQuestion,
      4: getQuestionApi[4]
    },
    createQuestion: {
      0: createQuestionApi[0],
      1: createQuestionApi[1],
      2: createQuestionApi[2],
      3: createQuestion,
      4: createQuestionApi[4]
    },
    updateQuestion: {
      0: updateQuestionApi[0],
      1: updateQuestionApi[1],
      2: updateQuestionApi[2],
      3: updateQuestion,
      4: updateQuestionApi[4]
    },
    deleteQuestion: {
      0: deleteQuestionApi[0],
      1: deleteQuestionApi[1],
      2: deleteQuestionApi[2],
      3: deleteQuestion,
      4: deleteQuestionApi[4]
    },
    assignOperator: {
      0: assignOperatorApi[0],
      1: assignOperatorApi[1],
      2: assignOperatorApi[2],
      3: assignOperator,
      4: assignOperatorApi[4]
    },
    transferQuestion: {
      0: transferQuestionApi[0],
      1: transferQuestionApi[1],
      2: transferQuestionApi[2],
      3: transferQuestion,
      4: transferQuestionApi[4]
    },
    closeQuestion: {
      0: closeQuestionApi[0],
      1: closeQuestionApi[1],
      2: closeQuestionApi[2],
      3: closeQuestion,
      4: closeQuestionApi[4]
    }
  };
};