// Standard JSON-RPC 2.0 error codes
// https://www.jsonrpc.org/specification#error_object
export enum BaseJsonRpcCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}
