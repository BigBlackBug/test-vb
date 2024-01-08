import { configure } from 'safe-stable-stringify';
import traverse from 'traverse';

import { LogRecordData } from './record';

export const REDACTION_MARKER = '[REDACTED]';
export const CIRCULAR_REFERENCE_MARKER = '[CIRCULAR REFERENCE REDACTED]';

export const stringify = configure({ circularValue: CIRCULAR_REFERENCE_MARKER });

export const SECRET_PATTERN =
  /(auth|([-_\.]|(api.*))key|p(w|ass(w(or)?d)?)|secret|session.*id|token$)/i;

export function isSecret(s: string) {
  return SECRET_PATTERN.test(s);
}

export const JSON_STRING_KEYS = ['body'];

/**
 * Replacer function for JSON.stringify that turns Errors in metadata into plain objects that can be
 * logged.
 */
export function redactionReplacer(key: string, value: any): any {
  if (value === undefined) {
    if (JSON_STRING_KEYS.includes(key)) {
      return '{}';
    }
    return 'undefined';
  }

  // Errors don't have enumerable own properties, so will just get dropped if passed to
  // JSON.stringify. This is not helpful, so instead, let's create copies of them that can be
  // logged, as suggested here:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description
  if (value instanceof Error) {
    const newErrorThing = Object.getOwnPropertyNames(value).reduce(
      (acc: Record<string, any>, name: string) => {
        acc[name] = (value as { [key: string]: any })[name];
        return acc;
      },
      {},
    );
    // Also, stack trace strings are hard to read in logs, so let's break them into lines.
    if ('stack' in newErrorThing && !('stackLines' in newErrorThing)) {
      newErrorThing.stackLines = newErrorThing.stack.split('\n').map((line: string) => line.trim());
    }
    return newErrorThing;
  }
  return value;
}

/**
 * Redacts log metadata.
 *
 * Circular references are replaced with CIRCULAR_REFERENCE_MARKER. The values of properties whose
 * names match patterns presumed to indicate secrets (like passwords, API tokens, keys) will be
 * redacted.
 */
export function redact(
  obj?: LogRecordData,
  marker: string = REDACTION_MARKER,
): LogRecordData | undefined {
  if (obj === undefined) {
    return undefined;
  }

  const stringifiedObj = stringify(obj, redactionReplacer);
  if (stringifiedObj === undefined) {
    return undefined;
  }

  const copy = JSON.parse(stringifiedObj);
  return traverse(copy).map(function (val) {
    if (this.key) {
      if (isSecret(this.key)) {
        this.update(marker);
      } else if (val && JSON_STRING_KEYS.includes(this.key)) {
        try {
          const parsedValue = JSON.parse(val);
          const redactedValue = redact(parsedValue, marker);
          const redactedValueString = stringify(redactedValue);
          this.update(redactedValueString);
        } catch (e) {
          // Only so much we can do. If it can't be edited as JSON, leave it be.
          console.error(`Error redacting JSON string key "${this.key}": %s`, getLoggableError(e));
        }
      }
    }
  });
}

/**
 * Extracts the message from an Error, or stringifies anything else.
 *
 * Useful if you just want the Error message outside of a redaction context.
 */
export function getLoggableError(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return stringify(e) as string;
}
