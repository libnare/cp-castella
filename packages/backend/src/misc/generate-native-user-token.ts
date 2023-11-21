/*
 * SPDX-FileCopyrightText: syuilo and other misskey, cherrypick contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { secureRndstr } from '@libnare/mk-square';

// eslint-disable-next-line import/no-default-export
export default () => secureRndstr(16);
