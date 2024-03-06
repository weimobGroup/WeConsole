import { wcScope } from '../config';

export const markCallApi = (apiName: string) => {
    wcScope().apiCallMark = apiName;
};
export const isMarkCallApi = (apiName: string) => {
    return wcScope().apiCallMark === apiName;
};
export const clearApiMarkCall = () => {
    delete wcScope().apiCallMark;
};
