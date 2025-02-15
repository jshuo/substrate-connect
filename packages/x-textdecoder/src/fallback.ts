// Copyright 2017-2023 @polkadot/x-textencoder authors & contributors
// SPDX-License-Identifier: Apache-2.0

// This is very limited, only handling Ascii values
export class TextDecoder {
  // eslint-disable-next-line no-useless-constructor
  constructor (_?: 'utf-8' | 'utf8') {
    // nothing
  }

  decode (value: Uint8Array): string {
    let result = '';

    for (let i = 0, count = value.length; i < count; i++) {
      result += String.fromCharCode(value[i]);
    }

    return result;
  }
}
