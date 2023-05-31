// Copyright 2017-2023 @polkadot/hw-secux authors & contributors
// SPDX-License-Identifier: Apache-2.0

/// <reference types="@polkadot/dev-test/globals.d.ts" />

import { supportedApps } from '@zondax/secux-substrate';

import { SecuXApps } from './defaults.js';

describe('SecuXApps', (): void => {
  for (const k of Object.keys(SecuXApps)) {
    it(`${k} is available in @zondax/secux-substrate`, (): void => {
      expect(
        supportedApps.find(({ name }) =>
          name === SecuXApps[k]
        )
      ).toBeDefined();
    });
  }
});
