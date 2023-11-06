import { AxiosError } from 'axios';

export const isAxiosError = (error: unknown) => {
  // Check if the error is an axios error
  if (!(error instanceof AxiosError)) {
    return false;
  }

  // Check if the error is a result of a 400 or 500 response
  if (
    error.code !== AxiosError.ERR_BAD_REQUEST &&
    error.code !== AxiosError.ERR_BAD_RESPONSE
  ) {
    return false;
  }

  return true;
};

export const getMessageFromAxiosError = (error: any) => {
  const { message, details } = error.response.data;

  let result = 'Unknown error (no error info returned from API)';

  if (Array.isArray(message)) {
    result = message.join(', ');
  } else if (typeof message === 'string') {
    result = message;
  }

  if (details) {
    result += ` ${JSON.stringify(details)}`;
  }

  return result;
};
