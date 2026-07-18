import type { MessageInstance } from 'antd/es/message/interface';

let messageApi: MessageInstance | null = null;

export function setMessageApi(api: MessageInstance) {
  messageApi = api;
}

export function showErrorMessage(content: string) {
  messageApi?.error(content);
}
