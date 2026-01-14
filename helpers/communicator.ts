import { MutableRefObject, useEffect, useState } from "react";
import { MessageFormatter } from "./messageFormatter";
import {
  SDKMessageEvent,
  MethodToResponse,
  Methods,
  ErrorResponse,
  RequestId,
} from "../types";
import { getSDKVersion } from "./utils";
import { SECURITY } from "../utils/constants";

type MessageHandler = (
  msg: SDKMessageEvent
) =>
  | void
  | MethodToResponse[Methods]
  | ErrorResponse
  | Promise<MethodToResponse[Methods] | ErrorResponse | void>;

export enum LegacyMethods {
  getEnvInfo = "getEnvInfo",
}

type SDKMethods = Methods | LegacyMethods;

class AppCommunicator {
  private iframeRef: MutableRefObject<HTMLIFrameElement | null>;
  private handlers = new Map<SDKMethods, MessageHandler>();
  private messageTimestamps = new Map<string, number>();
  private allowedOrigins: string[] = [];
  private cleanupInterval?: NodeJS.Timeout;

  constructor(iframeRef: MutableRefObject<HTMLIFrameElement | null>) {
    this.iframeRef = iframeRef;

    window.addEventListener("message", this.handleIncomingMessage);
    
    // Clean old timestamps periodically
    this.cleanupInterval = setInterval(
      () => this.cleanOldTimestamps(),
      SECURITY.MESSAGE_TIMESTAMP_CLEANUP_INTERVAL_MS
    );
  }

  private cleanOldTimestamps(): void {
    const cutoffTime = Date.now() - SECURITY.MESSAGE_TIMESTAMP_RETENTION_MS;
    for (const [id, timestamp] of this.messageTimestamps.entries()) {
      if (timestamp < cutoffTime) {
        this.messageTimestamps.delete(id);
      }
    }
  }

  setAllowedOrigin(origin: string): void {
    if (origin && !this.allowedOrigins.includes(origin)) {
      this.allowedOrigins.push(origin);
    }
  }

  on = (method: SDKMethods, handler: MessageHandler): void => {
    this.handlers.set(method, handler);
  };

  private isValidMessage = (msg: SDKMessageEvent): boolean => {
    // Validate message structure
    if (!msg.data || typeof msg.data !== 'object') {
      return false;
    }

    // Check iframe source
    const sentFromIframe = this.iframeRef.current?.contentWindow === msg.source;
    if (!sentFromIframe) {
      return false;
    }

    // Check for known method
    const knownMethod = Object.values(Methods).includes(msg.data.method);
    if (!knownMethod && !Object.values(LegacyMethods).includes(msg.data.method as unknown as LegacyMethods)) {
      return false;
    }

    // Replay protection - check timestamp
    const messageId = `${msg.data.id}_${msg.data.method}`;
    const now = Date.now();
    const lastTimestamp = this.messageTimestamps.get(messageId) || 0;
    
    // Reject messages within replay window (potential replay)
    if (now - lastTimestamp < SECURITY.MESSAGE_REPLAY_WINDOW_MS) {
      return false;
    }
    
    this.messageTimestamps.set(messageId, now);

    // Validate origin if allowed origins are set
    if (this.allowedOrigins.length > 0 && msg.origin) {
      try {
        const messageOrigin = new URL(msg.origin).origin;
        if (!this.allowedOrigins.includes(messageOrigin)) {
          return false;
        }
      } catch {
        return false;
      }
    }

    // Special case for cookie check (legacy support)
    if (msg.data.hasOwnProperty("isCookieEnabled")) {
      return true;
    }

    return true;
  };

  private canHandleMessage = (msg: SDKMessageEvent): boolean => {
    return Boolean(this.handlers.get(msg.data.method));
  };

  send = (data: unknown, requestId: RequestId, error = false): void => {
    const sdkVersion = getSDKVersion();
    const msg = error
      ? MessageFormatter.makeErrorResponse(
          requestId,
          data as string,
          sdkVersion
        )
      : MessageFormatter.makeResponse(requestId, data, sdkVersion);
    
    // Get target origin - use specific origin instead of wildcard
    const getTargetOrigin = (): string => {
      if (this.allowedOrigins.length > 0) {
        return this.allowedOrigins[0];
      }
      // Fallback to current origin if no specific origin set
      return typeof window !== "undefined" ? window.location.origin : "*";
    };
    
    const targetOrigin = getTargetOrigin();
    this.iframeRef.current?.contentWindow?.postMessage(msg, targetOrigin);
  };

  handleIncomingMessage = async (msg: SDKMessageEvent): Promise<void> => {
    const validMessage = this.isValidMessage(msg);
    const hasHandler = this.canHandleMessage(msg);

    if (validMessage && hasHandler) {
      // console.log("incoming", { msg: msg.data });

      const handler = this.handlers.get(msg.data.method);
      try {
        // @ts-expect-error Handler existence is checked in this.canHandleMessage
        const response = await handler(msg);

        // If response is not returned, it means the response will be sent somewhere else
        if (typeof response !== "undefined") {
          this.send(response, msg.data.id);
        }
      } catch (err: any) {
        this.send(err.message, msg.data.id, true);
      }
    }
  };

  clear = (): void => {
    window.removeEventListener("message", this.handleIncomingMessage);
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  };
}

const useAppCommunicator = (
  iframeRef: MutableRefObject<HTMLIFrameElement | null>
): AppCommunicator | undefined => {
  const [communicator, setCommunicator] = useState<AppCommunicator | undefined>(
    undefined
  );
  useEffect(() => {
    let communicatorInstance: AppCommunicator;
    const initCommunicator = (
      iframeRef: MutableRefObject<HTMLIFrameElement>
    ) => {
      communicatorInstance = new AppCommunicator(iframeRef);
      setCommunicator(communicatorInstance);
    };

    initCommunicator(iframeRef as MutableRefObject<HTMLIFrameElement>);

    return () => {
      communicatorInstance?.clear();
    };
  }, [iframeRef]);

  return communicator;
};

export { useAppCommunicator };
